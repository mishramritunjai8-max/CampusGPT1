import logging
import sys
from logging.handlers import RotatingFileHandler


def setup_logging(debug: bool = False):
    logger = logging.getLogger("campusgpt")
    logger.setLevel(logging.DEBUG if debug else logging.INFO)
    
    if logger.handlers:
        return logger
    
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.DEBUG if debug else logging.INFO)
    console.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    ))
    logger.addHandler(console)
    
    try:
        file_handler = RotatingFileHandler(
            "logs/app.log",
            maxBytes=10 * 1024 * 1024,
            backupCount=5
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(logging.Formatter(
            "%(asctime)s | %(levelname)-7s | %(name)s | %(filename)s:%(lineno)d | %(message)s"
        ))
        logger.addHandler(file_handler)
    except Exception:
        pass
    
    return logger
