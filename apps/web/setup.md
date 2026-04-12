```fish
# Firewall
ufw allow OpenSSH
ufw enable

# Fish Shell
sudo add-apt-repository ppa:fish-shell/release-4
sudo apt update
sudo apt install -y fish
chsh -s /usr/bin/fish

# Add User
set USERNAME "admin"
adduser --gecos "" $USERNAME
usermod -aG sudo $USERNAME
rsync --archive --chown=$USERNAME:$USERNAME ~/.ssh /home/$USERNAME
chsh -s /usr/bin/fish $USERNAME

# Docker
sudo apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch="(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu "(grep '^VERSION_CODENAME=' /etc/os-release | string replace 'VERSION_CODENAME=' '')" stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker (id -un)

# Server Folder
sudo mkdir /server
sudo chown -R (id -un):(id -gn) /server
```
