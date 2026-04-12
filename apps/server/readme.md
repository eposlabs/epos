## Server Setup

```fish
# Firewall
ufw allow OpenSSH
ufw enable

# Fish Shell
add-apt-repository ppa:fish-shell/release-4
apt update
apt install -y fish
chsh -s /usr/bin/fish

# Docker
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch="(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu "(grep '^VERSION_CODENAME=' /etc/os-release | string replace 'VERSION_CODENAME=' '')" stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

# Structure
mkdir -p /srv/apps

# New User
set USERNAME "admin"
adduser --gecos "" $USERNAME
usermod -aG sudo $USERNAME
usermod -aG docker $USERNAME
chown -R $USERNAME:$USERNAME /srv
chsh -s /usr/bin/fish $USERNAME
rsync --archive --chown=$USERNAME:$USERNAME ~/.ssh /home/$USERNAME
```
