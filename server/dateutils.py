from datetime import datetime
from typing import Optional

def format_month(month: int) -> str:
    if month == 1:
        return 'janvier'
    elif month == 2:
        return 'février'
    elif month == 3:
        return 'mars'
    elif month == 4:
        return 'avril'
    elif month == 5:
        return 'mai'
    elif month == 6:
        return 'juin'
    elif month == 7:
        return 'juillet'
    elif month == 8:
        return 'août'
    elif month == 9:
        return 'septembre'
    elif month == 10:
        return 'octobre'
    elif month == 11:
        return 'novembre'
    elif month == 12:
        return 'décembre'
    else:
        raise RuntimeError(f'No such month: {month}')


def format(date: datetime) -> str:
    return f'{date.day} {format_month(date.month)} {date.year} à {date.hour:02}h{date.minute:02}'


def format_short(date: Optional[datetime]) -> str:
    if date is None:
        return 'XX/XX/XXXX'

    return f'{date.day:02}/{date.month:02}/{date.year}'
