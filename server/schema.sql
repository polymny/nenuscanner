DROP TABLE IF EXISTS calibration;
DROP TABLE IF EXISTS acquisition;
DROP TABLE IF EXISTS object;

CREATE TABLE calibration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state INTEGER NOT NULL,
    validated_date INTEGER
);

CREATE TABLE acquisition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calibration_id INTEGER NOT NULL,
    object_id INTEGER NOT NULL,
    date INTEGER NOT NULL,
    validated INT NOT NULL,
    CONSTRAINT fk_calibration FOREIGN KEY(calibration_id) REFERENCES calibration(id),
    CONSTRAINT fk_object FOREIGN KEY(object_id) REFERENCES object(id) ON DELETE CASCADE
);

CREATE TABLE object (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    name TEXT NOT NULL
);
