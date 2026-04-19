import sentry_sdk
import os
from typing import Optional


def set_debate_context(debate_id: str, mode: Optional[str] = None, models: Optional[list] = None) -> None:
    sentry_sdk.set_tag("debate_id", debate_id)
    if mode:
        sentry_sdk.set_tag("debate_mode", mode)
    if models:
        sentry_sdk.set_context("debate", {"models": models, "model_count": len(models)})


def capture_debate_error(exception: Exception, debate_id: str, context: Optional[dict] = None) -> None:
    with sentry_sdk.new_scope() as scope:
        scope.set_tag("debate_id", debate_id)
        if context:
            scope.set_context("debate_context", context)
        sentry_sdk.capture_exception(exception)
