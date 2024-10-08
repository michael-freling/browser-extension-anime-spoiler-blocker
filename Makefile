.PHONY: setup
setup:
	# Install act for GitHub action local runner: https://nektosact.com/installation/index.html
	curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
	cp .env.example .env
	echo "Please fill in the .env file with your own values"
