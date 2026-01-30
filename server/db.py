#!/usr/bin/env python

from enum import IntEnum
from datetime import datetime
from flask import g
import itertools
import os
from os.path import join
import shutil
import sqlite3
from typing import Optional

if __name__ != '__main__':
    from . import config, dateutils
else:
    import config
    import dateutils


def get() -> sqlite3.Connection:
    if 'db' not in g:
        g.db = sqlite3.connect(
            config.DATABASE_PATH,
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
        cur = g.db.cursor()
        cur.execute('PRAGMA foreign_keys = on')

    return g.db


def init(db):
    with open('schema.sql', 'r') as f:
        db.executescript(f.read())


def close():
    db = g.pop('db', None)

    if db is not None:
        db.close()


def init_app(app):
    app.teardown_appcontext(close)
    app.cli.add_command(init)


class CalibrationState(IntEnum):
    Empty = 0
    HasData = 1
    IsComputed = 2
    IsValidated = 3


class Calibration:
    @staticmethod
    def select_args() -> str:
        return 'id, state, validated_date'

    def __init__(self, calibration_id: int, state: int, validated_date: Optional[int]):
        self.id = calibration_id
        self.state = CalibrationState(state)
        if validated_date is None:
            self.validated_date = None
        else:
            self.validated_date = datetime.fromtimestamp(validated_date)

    @staticmethod
    def create(db: sqlite3.Connection) -> 'Calibration':
        cur = db.cursor()
        response = cur.execute(
            'INSERT INTO calibration(state, validated_date) VALUES (?, NULL) RETURNING ' + Calibration.select_args() + ';',
            [int(CalibrationState.Empty)]
        )
        calibration = Calibration.from_row(response.fetchone())
        if calibration is None:
            return None
        os.makedirs(join(config.CALIBRATION_DIR, str(calibration.id)))
        return calibration

    @staticmethod
    def from_row(row: Optional['sqlite3.Row']) -> Optional['Calibration']:
        if row is None:
            return None
        return Calibration(*row)

    def save(self, db: sqlite3.Connection):
        cur = db.cursor()
        cur.execute(
            'UPDATE calibration SET state = ?, validated_date = ? WHERE id = ?',
            [int(self.state), int(self.validated_date.timestamp()) if self.validated_date is not None else None, self.id]
        )

    @staticmethod
    def get_from_id(calibration_id: int, db: sqlite3.Connection) -> Optional['Calibration']:
        cur = db.cursor()
        response = cur.execute(
            'SELECT ' + Calibration.select_args() + ' FROM calibration WHERE id = ?;',
            [calibration_id]
        )
        return Calibration.from_row(response.fetchone())

    @staticmethod
    def get_last(db: sqlite3.Connection) -> Optional['Calibration']:
        cur = db.cursor()
        response = cur.execute(
            'SELECT ' + Calibration.select_args() + ' FROM calibration WHERE state = 3 ORDER BY validated_date DESC LIMIT 1;',
            []
        )
        return Calibration.from_row(response.fetchone())

    def validate(self, db: sqlite3.Connection):
        self.state = CalibrationState.IsValidated
        self.validated_date = datetime.now()
        self.save(db)

    def get_pretty_date(self) -> str:
        return dateutils.format(self.validated_date)

    def get_pretty_short_date(self) -> str:
        return dateutils.format_short(self.validated_date)


Calibration.Dummy = Calibration(-1, CalibrationState.Empty, None)


class Acquisition:
    @staticmethod
    def select_args() -> str:
        return 'id, calibration_id, object_id, date, validated'

    def __init__(self, acquisition_id: int, calibration_id: int, object_id: int, date: int, validated: int):
        self.id = acquisition_id
        self.calibration_id = calibration_id
        self.object_id = object_id
        self.date = datetime.fromtimestamp(date)
        self.validated = validated != 0

    def save(self, db: sqlite3.Connection):
        cur = db.cursor()
        cur.execute(
            'UPDATE acquisition SET calibration_id = ?, object_id = ?, date = ?, validated = ? WHERE id = ?',
            [self.calibration_id, self.object_id, self.date.timestamp(), 1 if self.validated else 0, self.id]
        )

    @staticmethod
    def from_row(row: Optional[sqlite3.Row]) -> Optional['Acquisition']:
        if row is None:
            return None
        return Acquisition(*row)

    @staticmethod
    def get_from_id(acquisition_id: int, db: sqlite3.Connection) -> Optional['Acquisition']:
        cur = db.cursor()
        response = cur.execute(
            'SELECT ' + Acquisition.select_args() + ' FROM acquisition WHERE id = ?;',
            [acquisition_id]
        )
        return Acquisition.from_row(response.fetchone())

    def calibration(self, db: sqlite3.Connection) -> Optional[Calibration]:
        if self.calibration_id is None:
            return None

        return Calibration.get_from_id(self.calibration_id, db)

    def object(self, db: sqlite3.Connection) -> 'Object':
        return Object.get_from_id(self.object_id, db)

    def get_pretty_date(self) -> str:
        return dateutils.format(self.date)

    @staticmethod
    def delete_from_id(acquisition_id: int, db: sqlite3.Connection) -> 'Acquisition':
        cur = db.cursor()
        response = cur.execute(
            'DELETE FROM acquisition WHERE id = ? RETURNING ' + Acquisition.select_args() + ';',
            [acquisition_id]
        )
        return Acquisition.from_row(response.fetchone())


class Project:
    def __init__(self, name: str, objects: list['Object']):
        self.name = name
        self.objects = objects


class Object:
    @staticmethod
    def select_args() -> str:
        return 'id, name, project'

    def __init__(self, object_id: int, name: str, project: str):
        self.id = object_id
        self.name = name
        self.project = project

    def save(self, db: sqlite3.Connection):
        cur = db.cursor()
        cur.execute(
            'UPDATE object SET name = ?, project = ? WHERE id = ?',
            [self.name, self.project, self.id]
        )

    @staticmethod
    def from_row(row: Optional[sqlite3.Row]) -> Optional['Object']:
        if row is None:
            return None
        return Object(*row)

    @staticmethod
    def create(name: str, project: str, db: sqlite3.Connection) -> 'Object':
        cur = db.cursor()
        response = cur.execute(
            'INSERT INTO object(name, project) VALUES (?, ?) RETURNING ' + Object.select_args() + ';',
            [name, project]
        )
        object = Object.from_row(response.fetchone())
        os.makedirs(join(config.OBJECT_DIR, str(object.id)))
        return object

    @staticmethod
    def get_from_id(object_id: int, db: sqlite3.Connection) -> Optional['Object']:
        cur = db.cursor()
        response = cur.execute(
            'SELECT ' + Object.select_args() + ' FROM object WHERE id = ?;',
            [object_id]
        )
        return Object.from_row(response.fetchone())

    @staticmethod
    def all(db: sqlite3.Connection) -> list['Object']:
        cur = db.cursor()
        response = cur.execute(
            'SELECT ' + Object.select_args() + ' FROM object;',
            []
        )
        return list(map(Object.from_row, response.fetchall()))

    @staticmethod
    def all_by_project(db: sqlite3.Connection) -> list[Project]:
        objects = [x.full(db) for x in Object.all(db)]
        objects_by_projects = itertools.groupby(objects, lambda x: x.project)
        return list(map(lambda x: Project(x[0], list(x[1])), objects_by_projects))

    def add_acquisition(self, calibration_id: int, db: sqlite3.Connection) -> Acquisition:
        cur = db.cursor()
        response = cur.execute(
            'INSERT INTO acquisition(calibration_id, object_id, date, validated) VALUES (?, ?, ?, ?) RETURNING ' + Acquisition.select_args() + ';',
            [calibration_id, self.id, datetime.now().timestamp(), 0]
        )
        return Acquisition.from_row(response.fetchone())

    @staticmethod
    def delete_from_id(object_id: int, db: sqlite3.Connection) -> 'Object':
        cur = db.cursor()
        response = cur.execute(
            'DELETE FROM object WHERE id = ? RETURNING ' + Object.select_args() + ';',
            [object_id]
        )
        return Object.from_row(response.fetchone())

    def full(self, db: sqlite3.Connection) -> 'FullObject':
        cur = db.cursor()
        response = cur.execute(
            'SELECT ' + Acquisition.select_args() + ' FROM acquisition WHERE object_id = ? ORDER BY date DESC;',
            [self.id]
        )
        acquisitions = list(map(lambda x: Acquisition.from_row(x), response.fetchall()))
        return FullObject(self.id, self.name, self.project, acquisitions)


class FullObject(Object):
    def __init__(self, object_id: int, name: str, project: str, acquisitions: list[Acquisition]):
        super().__init__(object_id, name, project)
        self.id = object_id
        self.name = name
        self.project = project
        self.acquisitions = acquisitions


def main():
    # Move current data to backup dir
    if os.path.isdir(config.DATA_DIR):
        # Ensure backup dir exists
        os.makedirs(config.BACKUPS_DIR, exist_ok=True)

        now = datetime.now()
        dest = join(config.BACKUPS_DIR, f'{now.year}-{now.month:02}-{now.day:02}--{now.hour:02}-{now.minute:02}-{now.second:02}')
        shutil.move(config.DATA_DIR, dest)

    # Create new empty data dir
    os.makedirs(config.DATA_DIR, exist_ok=True)

    db = sqlite3.connect(
        config.DATABASE_PATH,
        detect_types=sqlite3.PARSE_DECLTYPES,
    )
    db.row_factory = sqlite3.Row
    init(db)


if __name__ == '__main__':
    main()
