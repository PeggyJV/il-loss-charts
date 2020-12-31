# Set VARS
export DEPLOY_BRANCH_NAME=kevin-rest

# Install nvm if not present

# Install or use v14 in nvm

# Install python
sudo apt-get update
sudo apt-get install python3.6
export PYTHON=python3

# Re-start shell
source /root/~.bashrc

# Clone repo
git clone https://github.com/PeggyJV/il-loss-charts

# Yarn install
npm install -g Yarn

# Install deps
cd il-loss-charts && git checkout $(DEPLOY_BRANCHNAME) && yarn

# Start process

# Allow nginx http
sudo ufw allow 'Nginx HTTP'

# Configure nginx
cp ./nginx.conf /etc/nginx/sites-available/default