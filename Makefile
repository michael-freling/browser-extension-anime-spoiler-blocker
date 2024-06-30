.PHONY: setup
setup:
	# Install act for GitHub action local runner: https://nektosact.com/installation/index.html
	curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

.PHONY: docs
docs:
	@echo "## Supported Anime" > docs/crunchyroll.md
	@jq -r '.services.crunchyroll.series | to_entries[] | "- \(.value.title)"' assets/configs/default_config.json >> docs/crunchyroll.md
