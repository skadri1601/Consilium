from .web_search import WebSearchTool
from .code_sandbox import CodeSandboxTool
from .file_reader import FileReaderTool

BUILTIN_TOOLS = {
    "web_search": WebSearchTool,
    "run_code": CodeSandboxTool,
    "read_file": FileReaderTool,
}
