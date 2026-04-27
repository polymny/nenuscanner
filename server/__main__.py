#!/usr/bin/env python

import os

from waitress import serve

from . import app


def main():
    port = os.environ.get('FLASK_RUN_PORT', 8000)
    print(f'Starting server on port {port}')
    serve(app, listen=f'*:{port}')


if __name__ == '__main__':
    main()
