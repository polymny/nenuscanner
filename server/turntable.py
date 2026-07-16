import atexit
import logging
import queue
import threading
from time import sleep

from serial import Serial

from . import config

logger = logging.getLogger(__name__)

COMMAND_TIMEOUT_SECONDS = 2.0
MAX_COMMAND_RETRIES = 5


class Turntable:
    def is_dummy(self) -> bool:
        pass

    def enable(self) -> None:
        pass

    def disable(self) -> None:
        pass

    def turn(self, degrees: float) -> None:
        pass

    def close(self) -> None:
        pass


class DummyTurntable(Turntable):
    def is_dummy(self) -> bool:
        return True

    def enable(self) -> None:
        logger.info('DummyTurntable: enable (TURN0, E if ERR_ENA)')

    def disable(self) -> None:
        logger.info('DummyTurntable: disable (TURN0, E if not ERR_ENA)')

    def turn(self, degrees: float) -> None:
        self.enable()
        logger.info('DummyTurntable: TURN%d', round(degrees))


class SerialTurntable(Turntable):
    """Plateau tournant piloté en série (commandes texte, une ligne par instruction)."""

    def __init__(self, port: str):
        self._lock = threading.Lock()
        self._running = True
        self._tx_queue: queue.Queue[str | None] = queue.Queue()
        self._rx_queue: queue.Queue[str] = queue.Queue()
        self._ser = Serial(port=port, baudrate=9600, dsrdtr=False, rtscts=False)
        self._rx_thread = threading.Thread(target=self._rx_loop, name='turntable-rx', daemon=True)
        self._tx_thread = threading.Thread(target=self._tx_loop, name='turntable-tx', daemon=True)
        self._rx_thread.start()
        self._tx_thread.start()

    def _rx_loop(self) -> None:
        buffer = ''
        while self._running:
            try:
                waiting = self._ser.in_waiting
                if waiting > 0:
                    buffer += self._ser.read(waiting).decode('utf-8')
                    lines = buffer.split('\n')
                    buffer = lines[-1]
                    for line in lines[:-1]:
                        stripped = line.strip()
                        if stripped:
                            self._rx_queue.put(stripped)
                            logger.warning('Turntable RX: %s', stripped)
            except UnicodeDecodeError as exc:
                logger.warning('Turntable RX decode error: %s', exc)
            sleep(0.01)

    def _tx_loop(self) -> None:
        while self._running:
            try:
                command = self._tx_queue.get(timeout=0.1)
            except queue.Empty:
                continue
            if command is None:
                break
            payload = command if command.endswith('\n') else f'{command}\n'
            self._ser.write(payload.encode('utf-8'))
            logger.warning('Turntable TX: %s', command.strip())

    def _drain_rx_queue(self) -> None:
        while True:
            try:
                self._rx_queue.get_nowait()
            except queue.Empty:
                return

    def _send(self, command: str) -> str | None:
        self._drain_rx_queue()
        self._tx_queue.put(command)
        try:
            response = self._rx_queue.get(timeout=COMMAND_TIMEOUT_SECONDS)
            logger.warning('Turntable %s -> %s', command, response)
            return response
        except queue.Empty:
            logger.warning('Turntable timeout waiting for response to %s', command)
            return None

    def _set_enabled(self, enabled: bool) -> None:
        for attempt in range(1, MAX_COMMAND_RETRIES + 1):
            response = self._send('TURN0')
            if response == 'ERR_ENA':
                if not enabled:
                    return
                self._send('E')
                continue
            if response == 'OK':
                if enabled:
                    return
                self._send('E')
                continue
            if response is not None:
                logger.warning(
                    'Turntable unexpected response %r for TURN0 (attempt %d/%d)',
                    response,
                    attempt,
                    MAX_COMMAND_RETRIES,
                )
        raise RuntimeError(f'turntable-{"enable" if enabled else "disable"}-failed')

    def is_dummy(self) -> bool:
        return False

    def enable(self) -> None:
        with self._lock:
            self._set_enabled(True)

    def disable(self) -> None:
        with self._lock:
            self._set_enabled(False)

    def turn(self, degrees: float) -> None:
        with self._lock:
            self._set_enabled(True)
            turn_command = f'TURN{round(degrees)}'
            response = self._send(turn_command)
            if response != 'OK':
                raise RuntimeError(f'turntable-command-failed:{turn_command}')

    def close(self) -> None:
        with self._lock:
            if not self._running:
                return
            self._running = False
            self._tx_queue.put(None)
            self._tx_thread.join(timeout=1.0)
            self._rx_thread.join(timeout=1.0)
            self._ser.close()


def _build_turntable() -> Turntable:
    port = getattr(config, 'TURNTABLE_SERIAL_PORT', None)
    if port is None:
        return DummyTurntable()
    return SerialTurntable(port)


_turntable = _build_turntable()


def guard_close() -> None:
    """Ferme le port série. Safe to call at shutdown."""
    _turntable.close()


atexit.register(guard_close)


def get() -> Turntable:
    return _turntable
