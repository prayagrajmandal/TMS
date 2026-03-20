from contextlib import contextmanager
from typing import Any

from psycopg import connect
from psycopg.rows import dict_row

from app.config import DATABASE_URL


@contextmanager
def db_cursor():
    with connect(DATABASE_URL, row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            yield cursor
        connection.commit()


def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db_cursor() as cursor:
        cursor.execute(sql, params)
        return list(cursor.fetchall())


def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    with db_cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.fetchone()


def execute(sql: str, params: tuple[Any, ...] = ()) -> None:
    with db_cursor() as cursor:
        cursor.execute(sql, params)
