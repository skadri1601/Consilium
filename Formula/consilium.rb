# Homebrew formula for the Consilium CLI.
#
# Place this file at:
#   skadri1601/homebrew-tap/Formula/consilium.rb
# Then users can:
#   brew tap skadri1601/tap
#   brew install consilium
#
# Or, once Consilium hits homebrew-core acceptance criteria (75+ GitHub stars,
# stable release cadence), submit a PR to homebrew/homebrew-core so users can:
#   brew install consilium
# without the tap.
#
# RELEASE-TIME ACTIONS (per release):
#   1. Run: bash packages/cli/scripts/build-binaries.sh
#   2. Upload binaries to GitHub Releases under tag cli-v<version>
#   3. Update the `version`, `url`, and `sha256` fields below
#      (the per-platform sha256s are listed under `on_macos` / `on_linux`)
#   4. Push the updated formula to the homebrew-tap repo
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
