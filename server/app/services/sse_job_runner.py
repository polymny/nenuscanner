"""Generic in-process SSE job runner (thread + queue per job)."""

from __future__ import annotations

import json
import threading
import uuid
from collections.abc import Callable
from dataclasses import dataclass, field
from queue import Empty, Queue
from typing import Any

from ... import leds

JobTask = Callable[['SseJobContext'], None]


@dataclass
class SseJob:
    id: str
    status: str = 'PENDING'
    events: Queue = field(default_factory=Queue)


class SseJobContext:
    """Passed to domain tasks so they can emit SSE events without knowing about queues."""

    def __init__(self, job: SseJob) -> None:
        self.job_id = job.id
        self._job = job

    def emit(self, event_type: str, payload: dict[str, Any]) -> None:
        self._job.events.put({'type': event_type, **payload})

    def set_status(self, status: str) -> None:
        self._job.status = status


class SseJobRegistry:
    """In-memory job registry for a single server process."""

    def __init__(self) -> None:
        self._jobs: dict[str, SseJob] = {}
        self._lock = threading.Lock()

    def get(self, job_id: str) -> SseJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def start(self, task: JobTask, *, thread_name_prefix: str = 'sse-job') -> str:
        job_id = uuid.uuid4().hex[:8]
        job = SseJob(id=job_id, status='RUNNING')
        with self._lock:
            self._jobs[job_id] = job

        thread = threading.Thread(
            target=self._run_task,
            args=(job_id, task),
            daemon=True,
            name=f'{thread_name_prefix}-{job_id}',
        )
        thread.start()
        return job_id

    def _run_task(self, job_id: str, task: JobTask) -> None:
        job = self.get(job_id)
        if job is None:
            return

        context = SseJobContext(job)
        try:
            task(context)
        except Exception:
            job.status = 'FAILED'
        finally:
            leds.guard_off()
            job.events.put(None)

    def iter_sse_events(self, job_id: str):
        job = self.get(job_id)
        if job is None:
            yield _format_sse('error', {'message': 'job-not-found'})
            return

        while True:
            try:
                event = job.events.get(timeout=15)
            except Empty:
                yield ': heartbeat\n\n'
                continue

            if event is None:
                break

            event_type = event.pop('type', 'message')
            yield _format_sse(event_type, event)


def _format_sse(event_type: str, payload: dict[str, Any]) -> str:
    return f'event: {event_type}\ndata: {json.dumps(payload)}\n\n'


sse_job_registry = SseJobRegistry()
