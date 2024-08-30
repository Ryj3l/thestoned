---
{"dg-publish":true,"permalink":"/the-stone/3-main/pam-tips-and-tricks/"}
---



# [[theStone/3. Main/PAM Tips & Tricks\|PAM Tips & Tricks]]

## 📝 Notes
### 1. **Check Password Policy and PAM Configuration**

`pam_pwquality` Can enforce some rules that might be the cause of issues. Let's inspect and modify the PAM configuration if necessary.

Edit the PAM configuration file for SSH:
```sh
sudo nano /etc/pam.d/sshd
```
Ensure it includes the following basic configuration:
```sh
# PAM configuration for the Secure Shell service

# Standard Un*x authentication.
@include common-auth
@include common-account
@include common-session
@include common-password

# Disallow non-root logins when /etc/nologin exists.
account    required     pam_nologin.so
```
### 2. **Check the Common PAM Configuration**

The common PAM configuration files included in the [[theStone/3. Main/Playbooks/Debian AD Integration\|Debian AD Integration]] configuration can be found in `/etc/pam.d/`. Specifically, you might want to look at `common-password`:
```sh
sudo nano /etc/pam.d/common-password
```
Ensure it includes sensible settings. Here's an example configuration:
```sh
# This file is sourced by /etc/pam.d/other to provide default behaviors.
# See pam.conf(5) for more details.

password        requisite                       pam_pwquality.so retry=3
password        [success=1 default=ignore]      pam_unix.so obscure use_authtok try_first_pass yescrypt
password        requisite                       pam_deny.so
password        required                        pam_permit.so
password        optional                        pam_gnome_keyring.so
```
### 3. **Adjust Password Quality Settings**

If password quality requirements are too strict, you can adjust `pam_pwquality` settings:
```sh
sudo nano /etc/security/pwquality.conf
```

Modify the settings to be less strict if necessary, for example:

```sh
minlen = 8 dcredit = -1 ucredit = -1 lcredit = -1 ocredit = -1`
```
- 



