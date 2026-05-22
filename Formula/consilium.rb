# Homebrew formula for the Consilium CLI.
#
# This file is the TEMPLATE. The actual published formula lives at
# skadri1601/homebrew-tap/Formula/consilium.rb and is rendered + pushed by
# .github/workflows/release-cli.yml on each cli-v* tag (version is bumped and
# the four REPLACE_WITH_*_SHA256 placeholders are filled in from the freshly
# built binaries).
#
# Users install via:
#   brew tap skadri1601/tap
#   brew install consilium
#
# Manual release (only if CI is unavailable):
#   1. bash packages/cli/scripts/build-binaries.sh
#   2. Upload packages/cli/dist-binaries/consilium-* to the cli-v<version> release
#   3. shasum -a 256 packages/cli/dist-binaries/consilium-* and substitute below
#   4. Push the rendered formula to skadri1601/homebrew-tap
class Consilium < Formula
  desc "Multi-AI council CLI - debate across providers, edit codebase together"
  homepage "https://myconsilium.xyz"
  version "0.4.0"
  license "UNLICENSED"

  on_macos do
    on_arm do
      url "https://github.com/skadri1601/Consilium/releases/download/cli-v#{version}/consilium-darwin-arm64"
      sha256 "REPLACE_WITH_DARWIN_ARM64_SHA256"
    end
    on_intel do
      url "https://github.com/skadri1601/Consilium/releases/download/cli-v#{version}/consilium-darwin-x64"
      sha256 "REPLACE_WITH_DARWIN_X64_SHA256"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/skadri1601/Consilium/releases/download/cli-v#{version}/consilium-linux-arm64"
      sha256 "REPLACE_WITH_LINUX_ARM64_SHA256"
    end
    on_intel do
      url "https://github.com/skadri1601/Consilium/releases/download/cli-v#{version}/consilium-linux-x64"
      sha256 "REPLACE_WITH_LINUX_X64_SHA256"
    end
  end

  def install
    binary_name = if OS.mac? && Hardware::CPU.arm?
                    "consilium-darwin-arm64"
                  elsif OS.mac?
                    "consilium-darwin-x64"
                  elsif OS.linux? && Hardware::CPU.arm?
                    "consilium-linux-arm64"
                  else
                    "consilium-linux-x64"
                  end
    bin.install binary_name => "consilium"
  end

  test do
    assert_match "consilium", shell_output("#{bin}/consilium --version")
  end
end
