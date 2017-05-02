#!/usr/bin/env bash

####### Preparation tasks
sudo apt-get update
sudo apt-get -y install build-essential vim curl

####### NodeJS
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs

####### StrongLoop
sudo npm install --unsafe-perm -g strongloop

####### MySQL
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password password root'
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password root'
sudo apt-get install -y mysql-server

# create DB
mysql -uroot -proot -e "create database api DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci"

# make server accessible from remote
sudo sed -i 's/= 127\.0\.0\.1/= 0\.0\.0\.0/g' /etc/mysql/my.cnf

# let root user login from remote
mysql -uroot -proot -e "create user 'root'@'%' identified by 'root';grant all privileges on *.* to 'root'@'%' with grant option;flush privileges;"

sudo service mysql restart

# do some cleaning
sudo ldconfig

####### ELK
# install Java
echo "deb http://ppa.launchpad.net/webupd8team/java/ubuntu trusty main" | sudo tee -a /etc/apt/sources.list.d/webupd8team-java.list
echo "deb-src http://ppa.launchpad.net/webupd8team/java/ubuntu trusty main" | sudo tee -a /etc/apt/sources.list.d/webupd8team-java.list
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys EEA14886
sudo apt-get update
sudo debconf-set-selections <<< 'debconf shared/accepted-oracle-license-v1-1 select true'
sudo debconf-set-selections <<< 'debconf shared/accepted-oracle-license-v1-1 seen true'
sudo apt-get install oracle-java8-installer -y

sudo mkdir -p /var/lib/strong-pm/svc/1/work
sudo ln -s /vagrant /var/lib/strong-pm/svc/1/work/current
