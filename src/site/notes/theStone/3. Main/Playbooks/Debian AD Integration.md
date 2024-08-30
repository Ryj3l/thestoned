---
{"dg-publish":true,"permalink":"/the-stone/3-main/playbooks/debian-ad-integration/"}
---

# [[theStone/3. Main/Playbooks/Debian AD Integration\|Debian AD Integration]]

## 📝 Notes

# Ubuntu/Debian AD Integration Runbook

## 1. Install Required Packages

```bash
sudo apt update
sudo apt install openssh-server realmd sssd sssd-tools libpam-sss libnss-sss libsss-sudo adcli samba-common-bin oddjob oddjob-mkhomedir krb5-kdc krb5-admin-server krb5-config
```

## 2. Join the Active Directory Domain

```bash
sudo realm discover int.spacecitycyber.com
sudo realm join --user=AD_admin_user int.spacecitycyber.com
```
 Enter the password for the AD admin user when prompted.

## 3. Configure SSSD

Edit the `/etc/sssd/sssd.conf` file:

```ini
[sssd]
domains = int.spacecitycyber.com
config_file_version = 2
services = nss, pam, sudo, ssh

[domain/int.spacecitycyber.com]
ad_domain = int.spacecitycyber.com
krb5_realm = INT.SPACECITYCYBER.COM
realmd_tags = manages-system joined-with-adcli
cache_credentials = True
id_provider = ad
auth_provider = ad
chpass_provider = ad
access_provider = ad
ldap_id_mapping = True
ldap_sasl_mech = GSSAPI
ldap_sasl_authid = host/$(hostname -f)
ldap_sasl_realm = INT.SPACECITYCYBER.COM
ldap_account_expire_policy = ad
ldap_user_extra_attrs = altSecurityIdentities:altSecurityIdentities
ldap_user_ssh_public_key = altSecurityIdenties
ldap_use_tokengroups = true
ad_gpo_access_control = enforcing
ad_gpo_map_remote_interactive = +xrdp-sesman
ldap_force_upper_case_realm = true
enumerate = True
fallback_homedir = /home/%u@%d
default_shell = /bin/bash
krb5_store_password_if_offline = true
use_fully_qualified_names = true

[pam]
offline_credentials_expiration = 2

[sudo]
sudo_provider = ldap
ldap_sudo_search_base = ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
ldap_sudo_smart_refresh_interval = 3600
ldap_sudo_full_refresh_interval = 86400

[ssh]
ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys
ssh_authorizedkeys_command_user = nobody
```

If your AD environment is LDAPS enabled use this ini file instead:

```ini
[sssd]
domains = int.spacecitycyber.com
config_file_version = 2
services = nss, pam, sudo, ssh

[domain/int.spacecitycyber.com]
ad_domain = int.spacecitycyber.com
krb5_realm = INT.SPACECITYCYBER.COM
realmd_tags = manages-system joined-with-adcli
cache_credentials = True
id_provider = ad
auth_provider = ad
chpass_provider = ad
access_provider = ad
ldap_uri = ldaps://ad-server.int.spacecitycyber.com  # Update with your AD server's address
ldap_id_mapping = True
ldap_sasl_mech = GSSAPI
ldap_sasl_authid = host/$(hostname -f)
ldap_sasl_realm = INT.SPACECITYCYBER.COM
ldap_account_expire_policy = ad
ldap_user_extra_attrs = altSecurityIdentities:altSecurityIdentities
ldap_user_ssh_public_key = altSecurityIdenties
ldap_use_tokengroups = true
ad_gpo_access_control = enforcing
ad_gpo_map_remote_interactive = +xrdp-sesman
ldap_force_upper_case_realm = true
enumerate = True
fallback_homedir = /home/%u@%d
default_shell = /bin/bash
krb5_store_password_if_offline = true
use_fully_qualified_names = true

[pam]
offline_credentials_expiration = 2

[sudo]
sudo_provider = ldap
ldap_sudo_search_base = ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
ldap_sudo_smart_refresh_interval = 3600
ldap_sudo_full_refresh_interval = 86400

[ssh]
ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys
ssh_authorizedkeys_command_user = nobody
```

Set appropriate permissions:

```bash
sudo chmod 600 /etc/sssd/sssd.conf
```

### 3.1 **Start and Enable SSH Service**

Start the SSH service and enable it to start on boot:

```sh
sudo systemctl start ssh sudo systemctl enable ssh
```
### 3.2 **Check the SSH Service Status**

Verify that the SSH service is running:
```sh
sudo systemctl status ssh
```
### 3.4 **Firewall Configuration**

If you have a firewall running, ensure that it allows SSH connections on port 22:
```sh
sudo ufw allow 22/tcp sudo ufw reload
```
## 4. Extend the AD Schema and Create Sudo LDAP Entries (On the Domain Controller)

### Step 4.1: [[theStone/3. Main/Playbooks/Extend the AD Schema#Tools Needed on Windows\|Windows]] OR [[theStone/3. Main/Playbooks/Extend the AD Schema#Linux Tools\|Linux]]

- Extending the AD schema is a critical operation that typically requires administrative tools and permissions that are available on Domain Controllers. This ensures the operation is performed securely and correctly. This step typically requires schema admin privileges.

#### Step 4.1.1: Prepare the Sudo Schema LDIF File

Create a file named `sudo.schema` with the following content:

```ldif
dn: CN=sudoCommand,CN=Schema,CN=Configuration,DC=int,DC=spacecitycyber,DC=com
changetype: add
objectClass: top
objectClass: attributeSchema
lDAPDisplayName: sudoCommand
attributeId: 1.3.6.1.4.1.15953.9.1.1
attributeSyntax: 2.5.5.12
oMSyntax: 64
isSingleValued: FALSE
cn: sudoCommand
adminDescription: Command(s) that are allowed to be run by the user(s)

dn: CN=sudoOption,CN=Schema,CN=Configuration,DC=int,DC=spacecitycyber,DC=com
changetype: add
objectClass: top
objectClass: attributeSchema
lDAPDisplayName: sudoOption
attributeId: 1.3.6.1.4.1.15953.9.1.2
attributeSyntax: 2.5.5.12
oMSyntax: 64
isSingleValued: FALSE
cn: sudoOption
adminDescription: Options for sudo rules

dn: CN=sudoUser,CN=Schema,CN=Configuration,DC=int,DC=spacecitycyber,DC=com
changetype: add
objectClass: top
objectClass: attributeSchema
lDAPDisplayName: sudoUser
attributeId: 1.3.6.1.4.1.15953.9.1.3
attributeSyntax: 2.5.5.12
oMSyntax: 64
isSingleValued: FALSE
cn: sudoUser
adminDescription: User(s) allowed by sudo rule

dn: CN=sudoHost,CN=Schema,CN=Configuration,DC=int,DC=spacecitycyber,DC=com
changetype: add
objectClass: top
objectClass: attributeSchema
lDAPDisplayName: sudoHost
attributeId: 1.3.6.1.4.1.15953.9.1.4
attributeSyntax: 2.5.5.12
oMSyntax: 64
isSingleValued: FALSE
cn: sudoHost
adminDescription: Host(s) allowed by sudo rule

dn: CN=sudoRole,CN=Schema,CN=Configuration,DC=int,DC=spacecitycyber,DC=com
changetype: add
objectClass: top
objectClass: classSchema
cn: sudoRole
governsId: 1.3.6.1.4.1.15953.9.2.1
rDNAttID: cn
subClassOf: top
objectClassCategory: 1
mayContain: sudoCommand
mayContain: sudoOption
mayContain: sudoUser
mayContain: sudoHost
adminDescription: Sudo role for users
possSuperiors: top

```

#### Step 4.1.2: Import the Schema LDIF File

1. **Open Command Prompt as Administrator**:
   - Click Start, type `cmd`, right-click Command Prompt, and select Run as Administrator.

2. **Run the `ldifde` Command to Import the Schema**: 
```cmd
ldifde -i -f sudo.schema -c "CN=Schema,CN=Configuration,DC=X" "CN=Schema,CN=Configuration,DC=int,DC=spacecitycyber,DC=com"   
```

3. **Verify the Schema Extension**:
   - Use ADSI Edit to verify the new schema classes and attributes. Open ADSI Edit and navigate to `Schema` to ensure `sudoCommand`, `sudoOption`, `sudoUser`, `sudoHost`, and `sudoRole` are present.
![SchemeExtensionVerification.png](/img/user/theStone/4.%20Assets/SchemeExtensionVerification.png)
### Step 4.2: Create Sudo LDAP Entries

### Step 4.2.1: Create Organizational Unit for Sudoers
**Prepare the LDIF File**: Create a file named `create_ou.ldif` with the following example content:
```
dn: ou=SUDOers,dc=int,dc=spacecitycyber,dc=com 
changetype: add 
objectClass: organizationalUnit 
ou: SUDOers
```
    
**Import the LDIF File**: Open Command Prompt as Administrator and run:
```
ldifde -i -f create_ou.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
```

   **Replace `admin@int.spacecitycyber.com` with the appropriate admin user
   
### Step 4.2.2: Create Sudo Rules

1. **Prepare the LDIF File**: Create a file named `sudoers.ldif` with the following example content:
```
dn: cn=defaults,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com 
changetype: add 
objectClass: top o
bjectClass: sudoRole 
cn: defaults 
sudoOption: !authenticate 
dn: cn=hiroSU,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com 
changetype: add 
objectClass: top 
objectClass: sudoRole 
cn: hiroSU 
sudoUser: %hiroSU 
sudoHost: ALL 
sudoCommand: /bin/su hiro_SVC
```
 **Import the LDIF File**: Open Command Prompt as Administrator and run:
```
ldifde -i -f sudoers.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
```
   
   **Again, replace `admin@int.spacecitycyber.com` with the appropriate admin user**
## 5. Configure NSS

**Edit the `/etc/nsswitch.conf` file to include `sss`:

```text
# /etc/nsswitch.conf
#
# Example configuration of GNU Name Service Switch functionality.
# If you have the `glibc-doc-reference' and `info' packages installed, try:
# `info libc "Name Service Switch"' for information about this file.

passwd:         files systemd sss
group:          files systemd sss
shadow:         files sss
gshadow:        files

hosts:          files mdns4_minimal [NOTFOUND=return] dns
networks:       files

sudoers:	files sss
protocols:      db files
services:       db files sss
ethers:         db files
rpc:            db files

netgroup:       files	nis sss
automount:      files	sss
```

## 6. Configure SSH to Use SSSD for Authorized Keys

### a. [[theStone/3. Main/Playbooks/Add SSH Keys to AD User Attributes\|Add SSH Keys to AD User Attributes]]

**Add SSH keys to the `altSecurityIdentities` attribute in AD for each user. This can be done using AD Users and Computers or a script.

### B. Edit the [[Debian AD Integration#8. Complete Example of `sshd_config|SSHD_Config]] /etc/ssh/sshd_config` 

**Add the following lines:

```text
# AuthorizedKeysCommand configuration
AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
AuthorizedKeysCommandUser nobody
```

## 7. Enable and Configure PAM

**Ensure that PAM is enabled and configured in `/etc/pam.d/sshd`:

```text
#%PAM-1.0
auth	   required     pam_sss.so
auth       required     pam_sepermit.so
auth       include      password-auth
auth       required     pam_env.so
auth       sufficient   pam_sss.so
auth       required     pam_deny.so
account    sufficient   pam_sss.so
account    required     pam_unix.so
account    required     pam_nologin.so
account    include      password-auth
password   sufficient   pam_sss.so
password   required     pam_unix.so
password   include      password-auth
session    required     pam_limits.so
session    required     pam_unix.so
session    optional     pam_sss.so
session    required     pam_selinux.so close
session    required     pam_loginuid.so
session    optional     pam_keyinit.so force revoke
session    include      password-auth
session    required     pam_selinux.so open env_params
session    optional     pam_motd.so
session    optional     pam_mail.so standard
session    required     pam_limits.so
session    required     pam_oddjob_mkhomedir.so skel=/etc/skel umask=077
```

**Ensure that PAM is enabled and configured in `/etc/pam.d/common-session`:

```text
#
# /etc/pam.d/common-session - session-related modules common to all services
#
# This file is included from other service-specific PAM config files,
# and should contain a list of modules that define tasks to be performed
# at the start and end of interactive sessions.
#
# As of pam 1.0.1-6, this file is managed by pam-auth-update by default.
# To take advantage of this, it is recommended that you configure any
# local modules either before or after the default block, and use
# pam-auth-update to manage selection of other modules.  See
# pam-auth-update(8) for details.

# here are the per-package modules (the "Primary" block)
session	[default=1]			pam_permit.so
# here's the fallback if no module succeeds
session	requisite			pam_deny.so
# prime the stack with a positive return value if there isn't one already;
# this avoids us returning an error just because nothing sets a success code
# since the modules above will each just jump around
session	required			pam_permit.so
# The pam_umask module will set the umask according to the system default in
# /etc/login.defs and user settings, solving the problem of different
# umask settings with different shells, display managers, remote sessions etc.
# See "man pam_umask".
session optional			pam_umask.so
# and here are more per-package modules (the "Additional" block)
session	required	pam_unix.so 
session	optional			pam_sss.so 
session	optional	pam_systemd.so 
session	optional			pam_mkhomedir.so 
session required pam_oddjob_mkhomedir.so skel=/etc/skel umask=0077
# end of pam-auth-update config
```

**Ensure that PAM is enabled and configured in `/etc/pam.d/password-auth`:

```text
password   requisite    pam_pwquality.so retry=3
password   [success=1 default=ignore] pam_unix.so obscure use_authtok try_first_pass yescrypt
password   required     pam_deny.so
```

#### Complete Example of `sshd_config`

**Here’s a complete example of your `sshd_config` file:

```text
# This is the sshd server system-wide configuration file.  See
# sshd_config(5) for more information.

Port 22
AddressFamily any
ListenAddress 0.0.0.0
ListenAddress ::

# The default requires explicit activation of protocol 1
Protocol 2

# HostKey for protocol version 1
# HostKey /etc/ssh/ssh_host_key
# HostKeys for protocol version 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_dsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Lifetime and size of ephemeral version 1 server key
# KeyRegenerationInterval 1h
# ServerKeyBits 1024

# Ciphers and keying
# RekeyLimit default none

# Logging
# obsoletes QuietMode and FascistLogging
SyslogFacility AUTH
LogLevel VERBOSE

# Authentication:

LoginGraceTime 2m
PermitRootLogin prohibit-password
StrictModes yes
MaxAuthTries 5
MaxSessions 10

#RSAAuthentication no
PubkeyAuthentication yes

# The default is to check both .ssh/authorized_keys and .ssh/authorized_keys2
# but this is overridden so installations will only check .ssh/authorized_keys
AuthorizedKeysFile     .ssh/authorized_keys .ssh/authorized_keys2

#AuthorizedPrincipalsFile none

# For this to work you will also need host keys in /etc/ssh/ssh_known_hosts
#HostbasedAuthentication no
# Change to yes if you don't trust ~/.ssh/known_hosts for
# HostbasedAuthentication
#IgnoreUserKnownHosts no
# Don't read the user's ~/.rhosts and ~/.shosts files
IgnoreRhosts yes

# To disable tunneled clear text passwords, change to no here!
PasswordAuthentication yes
#PermitEmptyPasswords no
#PasswordAuthentication no

# Change to no to disable s/key passwords
ChallengeResponseAuthentication no

# Kerberos options
KerberosAuthentication yes
KerberosOrLocalPasswd yes
KerberosTicketCleanup yes
#KerberosGetAFSToken no

# GSSAPI options
GSSAPIAuthentication yes
GSSAPICleanupCredentials yes

# Set this to 'yes' to enable PAM authentication, account processing,
# and session processing. If this is enabled, PAM authentication will
# be allowed through the ChallengeResponseAuthentication and
# PasswordAuthentication.  Depending on your PAM configuration,
# PAM authentication via ChallengeResponseAuthentication may bypass
# the setting of "PermitRootLogin without-password".
# If you just want the PAM account and session checks to run without
# PAM authentication, then enable this but set PasswordAuthentication
# and ChallengeResponseAuthentication to 'no'.
UsePAM yes

#AllowAgentForwarding yes
#AllowTcpForwarding yes
#GatewayPorts no
#X11Forwarding yes
#X11DisplayOffset 10
#X11UseLocalhost yes
#PermitTTY yes
#PrintMotd yes
#PrintLastLog yes
#TCPKeepAlive yes
#UseLogin no
#PermitUserEnvironment no
#Compression delayed
#ClientAliveInterval 0
#ClientAliveCountMax 3
#UseDNS no
#PidFile /var/run/sshd.pid
#MaxStartups 10:30:100
#PermitTunnel no
#ChrootDirectory none
#VersionAddendum none

# no default banner path
#Banner none

# Allow client to pass locale environment variables
AcceptEnv LANG LC_*

# override default of no subsystems
Subsystem   sftp    /usr/lib/openssh/sftp-server

# Example of overriding settings on a per-user basis
# Match User anoncvs
#   X11Forwarding no
#   AllowTcpForwarding no
#   PermitTTY no
#   ForceCommand cvs server

# AuthorizedKeysCommand configuration
AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
AuthorizedKeysCommandUser nobody
```

**The Secure way is as follows:

```text

# This is the sshd server system-wide configuration file.  See
# sshd_config(5) for more information.

Port 22
AddressFamily any
ListenAddress 0.0.0.0
ListenAddress ::

# The default requires explicit activation of protocol 1
Protocol 2

# HostKey for protocol version 1
# HostKey /etc/ssh/ssh_host_key
# HostKeys for protocol version 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_dsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# Lifetime and size of ephemeral version 1 server key
# KeyRegenerationInterval 1h
# ServerKeyBits 1024

# Ciphers and keying
# RekeyLimit default none

# Logging
# obsoletes QuietMode and FascistLogging
SyslogFacility AUTH
LogLevel VERBOSE    # More detailed logging for Security Audits

# Authentication:

LoginGraceTime 1m
PermitRootLogin prohibit-password
StrictModes yes
MaxAuthTries 3   # Lower the number of Authentication attempts
MaxSessions 10

#RSAAuthentication no
PubkeyAuthentication yes

# The default is to check both .ssh/authorized_keys and .ssh/authorized_keys2
# but this is overridden so installations will only check .ssh/authorized_keys
AuthorizedKeysFile     .ssh/authorized_keys

#AuthorizedPrincipalsFile none

# For this to work you will also need host keys in /etc/ssh/ssh_known_hosts
#HostbasedAuthentication no
# Change to yes if you don't trust ~/.ssh/known_hosts for
# HostbasedAuthentication
#IgnoreUserKnownHosts no
# Don't read the user's ~/.rhosts and ~/.shosts files
IgnoreRhosts yes

# To disable tunneled clear text passwords, change to no here!
PasswordAuthentication no
PermitEmptyPasswords no

# Change to no to disable s/key passwords
ChallengeResponseAuthentication no

# Kerberos options
KerberosAuthentication yes
KerberosOrLocalPasswd yes
KerberosTicketCleanup yes
#KerberosGetAFSToken no

# GSSAPI options
GSSAPIAuthentication yes
GSSAPICleanupCredentials yes
GSSAPIKeyExchange yes # Enable GSSAPI key exchange for better security

# Set this to 'yes' to enable PAM authentication, account processing,
# and session processing. If this is enabled, PAM authentication will
# be allowed through the ChallengeResponseAuthentication and
# PasswordAuthentication.  Depending on your PAM configuration,
# PAM authentication via ChallengeResponseAuthentication may bypass
# the setting of "PermitRootLogin without-password".
# If you just want the PAM account and session checks to run without
# PAM authentication, then enable this but set PasswordAuthentication
# and ChallengeResponseAuthentication to 'no'.
UsePAM yes

# Disable root login with password, only allow root login with keys PermitRootLogin prohibit-password 

# Disable agent forwarding unless necessary 
AllowAgentForwarding no 
#AllowTcpForwarding yes
#GatewayPorts no
#X11Forwarding yes
#X11DisplayOffset 10
#X11UseLocalhost yes
#PermitTTY yes
#PrintMotd yes
#PrintLastLog yes
#TCPKeepAlive yes
#UseLogin no
#PermitUserEnvironment no
#Compression delayed
#ClientAliveInterval 0
#ClientAliveCountMax 3
#UseDNS no
#PidFile /var/run/sshd.pid
#MaxStartups 10:30:100
#PermitTunnel no
#ChrootDirectory none
#VersionAddendum none

# no default banner path
#Banner none

# Allow client to pass locale environment variables
AcceptEnv LANG LC_*

# override default of no subsystems
Subsystem   sftp    /usr/lib/openssh/sftp-server

# Example of overriding settings on a per-user basis
# Match User anoncvs
#   X11Forwarding no
#   AllowTcpForwarding no
#   PermitTTY no
#   ForceCommand cvs server

# AuthorizedKeysCommand configuration
AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
AuthorizedKeysCommandUser nobody

# Additional security options 
PermitUserEnvironment no # Prevent users from setting environment variables Compression delayed # Enable compression after authentication ClientAliveInterval 300 # Send a keepalive message every 300 seconds (5mins) ClientAliveCountMax 2 # Disconnect after 2 missed keepalive messages 
UseDNS no # Disable DNS lookups for faster authentication 
# Disable root login 
PermitRootLogin no 

# Example of overriding settings on a per-user basis 
# Match User anoncvs 
# X11Forwarding no 
# AllowTcpForwarding no 
# PermitTTY no 
# ForceCommand cvs server
```

## 8. Configure Kerberos

1. During the installation, you'll be prompted to configure the Kerberos realm. Whether you missed this step or not, you can configure it manually by editing the Kerberos configuration file.

2. Edit the Kerberos configuration file:
```bash
sudo nano /etc/krb5.conf
```

   Here's an example configuration:

```plaintext
[logging]
 default = FILE:/var/log/krb5libs.log
 kdc = FILE:/var/log/krb5kdc.log
 admin_server = FILE:/var/log/kadmind.log

[libdefaults]
 default_realm = INT.SPACECITYCYBER.COM
 dns_lookup_realm = false
 dns_lookup_kdc = true
 ticket_lifetime = 24h
 renew_lifetime = 7d
 forwardable = true

[realms]
 INT.SPACECITYCYBER.COM = {
  kdc = dc1.int.spacecitycyber.com
  admin_server = dc1.int.spacecitycyber.com
 }

[domain_realm]
 .int.spacecitycyber.com = INT.SPACECITYCYBER.COM
 int.spacecitycyber.com = INT.SPACECITYCYBER.COM
```

3. Edit the KDC configuration file:
```bash
sudo nano /etc/krb5kdc/kdc.conf
```

   Example configuration:

```plaintext
[kdcdefaults]
	kdc_ports = 88

[realms]
	INT.SPACECITYCYBER.COM = {
	    database_name = /var/lib/krb5kdc/principal
	    admin_keytab = /etc/krb5kdc/kadm5.keytab
	    acl_file = /etc/krb5kdc/kadm5.acl
	    key_stash_file = /etc/krb5kdc/stash
	    kdc_ports = 88
	    max_life = 10h 0m 0s
	    max_renewable_life = 7d 0h 0m 0s
	}
```

4. Create the Kerberos database:
```bash
sudo krb5_newrealm
```

#### Start the Kerberos Services

1. Start the KDC and admin server:
```bash
sudo systemctl start krb5-kdc
sudo systemctl start krb5-admin-server
```

2. Enable the services to start on boot:
```bash
sudo systemctl enable krb5-kdc
sudo systemctl enable krb5-admin-server
```
#### Testing the Kerberos Setup

1. Obtain a Kerberos ticket for the admin principal:
```bash
kinit admin
```
2. Verify the ticket:
```bash
klist
```

You should see the ticket listed.
## 9. Restart Services

**Restart ssh, SSSD and SSH services to apply the changes:

```bash
sudo systemctl restart sssd
sudo systemctl restart sshd
sudo systemctl restart ssh
```
### Summary

This runbook provides a step-by-step guide to integrating an Ubuntu/Debian machine with an Active Directory environment, extending the AD schema for sudo rules, and managing ssh keys.
## Additional Considerations

- **[[theStone/3. Main/Playbooks/AD Groups for Sudo Rules\|AD Groups for Sudo Rules]]**: If you want to manage sudo rules centrally, consider using Group Policy and AD Bridge Enterprise or another similar tool. Or build some automation to speed up the creation of new sudo rules.

- **FreeIPA Integration**: For more advanced SSH key management, integrating FreeIPA with AD might be beneficial.
- [[theStone/3. Main/Playbooks/Setting up Kerberos in Linux\|Setting up Kerberos in Linux]]
- [[theStone/3. Main/Playbooks/Extend the AD Schema\|Extend the AD Schema]]
- [[theStone/3. Main/Playbooks/Add SSH Keys to AD User Attributes\|Add SSH Keys to AD User Attributes]]


