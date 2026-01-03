"""Base agent class for all AI agents."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage


class BaseAgent(ABC):
    """Abstract base class for AI agents."""

    def __init__(
        self,
        agent_id: str,
        name: str,
        provider: str,
        model_id: str,
    ):
        self.agent_id = agent_id
        self.name = name
        self.provider = provider
        self.model_id = model_id
        self._llm = None

    @property
    def llm(self):
        """Get or create the LLM instance."""
        if self._llm is None:
            self._llm = self._create_llm()
        return self._llm

    @abstractmethod
    def _create_llm(self) -> Any:
        """Create the LLM instance for this agent."""
        pass

    async def invoke(self, query: str, context: Optional[Dict] = None) -> Dict:
        """Invoke the agent with a query."""
        import time

        start_time = time.time()

        messages = [HumanMessage(content=query)]

        try:
            response = await self.llm.ainvoke(messages)
            content = response.content if hasattr(response, "content") else str(response)

            latency_ms = int((time.time() - start_time) * 1000)

            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "provider": self.provider,
                "content": content,
                "latency_ms": latency_ms,
                "success": True,
            }
        except Exception as e:
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "provider": self.provider,
                "content": "",
                "error": str(e),
                "success": False,
            }

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(id={self.agent_id}, provider={self.provider})"
