"""Turntable driven by an Arduino over serial: one text command per line, answers end with \\r\\n.

Protocol (firmware "nenu360"): CONN, DRV0/DRV1 (driver), TURN<degrees> in [-360, 360], MOV? (MOV0/MOV1),
SPEED<rpm>/SPEED?, STOP, FAN<percent>/FANX/FAN?, TEMP?. Values are integers glued to the command name.
"""

import atexit
import logging
import threading
import time

from serial import Serial

from . import config

logger = logging.getLogger(__name__)

COMMAND_TIMEOUT_SECONDS = 2.0
MAX_COMMAND_RETRIES = 3
TURN_TIMEOUT_SECONDS = 120.0
MOVE_POLL_SECONDS = 0.2
# Fan speed while the driver is on (percent). The fan is off the rest of the time (noise, vibrations during shots),
# so it blows at full speed during the short rotations.
DEFAULT_FAN_SPEED = 100


class Turntable:
    def power_off(self) -> None:
        pass

    def turn(self, degrees: int) -> None:
        pass

    def close(self) -> None:
        pass


class DummyTurntable(Turntable):
    def power_off(self) -> None:
        logger.info('DummyTurntable: DRV0, FAN0')

    def turn(self, degrees: int) -> None:
        logger.info('DummyTurntable: TURN%d', degrees)


class SerialTurntable(Turntable):
    def __init__(self, port: str):
        self._lock = threading.Lock()
        self._fan_speed = getattr(config, 'TURNTABLE_FAN_SPEED', DEFAULT_FAN_SPEED)
        self._ser = Serial(port=port, baudrate=9600, dsrdtr=False, rtscts=False, timeout=COMMAND_TIMEOUT_SECONDS)
        try:
            self._command('CONN')
            self.power_off()
        except RuntimeError:
            # Do not prevent the server from starting: turns will fail loudly instead.
            logger.exception('Turntable not responding on %s', port)

    def _send(self, command: str) -> str | None:
        self._ser.reset_input_buffer()
        self._ser.write(f'{command}\n'.encode())
        response = self._ser.readline().decode(errors='replace').strip()
        logger.debug('Turntable %s -> %r', command, response)
        return response or None

    def _command(self, command: str, expected_prefix: str = 'OK') -> str:
        """Sends an idempotent command, retrying on timeout or unexpected answer."""
        response = None
        for _ in range(MAX_COMMAND_RETRIES):
            response = self._send(command)
            if response is not None and response.startswith(expected_prefix):
                return response
            logger.warning('Turntable: unexpected answer %r to %s', response, command)
        raise RuntimeError(f'turntable-command-failed:{command}:{response}')

    def _set_power(self, on: bool) -> None:
        self._command('DRV1' if on else 'DRV0')
        self._command(f'FAN{self._fan_speed if on else 0}')

    def _wait_until_stopped(self) -> None:
        deadline = time.monotonic() + TURN_TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            time.sleep(MOVE_POLL_SECONDS)
            if self._command('MOV?', 'MOV') == 'MOV0':
                return
        self._command('STOP')
        raise RuntimeError('turntable-turn-timeout')

    def power_off(self) -> None:
        with self._lock:
            self._set_power(False)

    def turn(self, degrees: int) -> None:
        """Rotates and waits for the end of the move, then powers the driver and fan off: they vibrate, and nothing
        must move during shots."""
        with self._lock:
            self._set_power(True)
            try:
                # Not retried: if the OK got lost, a retry would turn the plate twice.
                response = self._send(f'TURN{degrees}')
                if response != 'OK':
                    raise RuntimeError(f'turntable-turn-failed:{response}')
                self._wait_until_stopped()
            finally:
                self._set_power(False)

    def close(self) -> None:
        with self._lock:
            if self._ser.is_open:
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
