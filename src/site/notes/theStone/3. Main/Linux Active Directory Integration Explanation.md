---
{"dg-publish":true,"permalink":"/the-stone/3-main/linux-active-directory-integration-explanation/"}
---

# [[theStone/3. Main/Linux Active Directory Integration Explanation\|Linux Active Directory Integration Explanation]]

# Debian AD Integration Guide and Explanations

## 📝 Introduction

This guide walks you through the steps required to integrate a Debian (or Ubuntu) machine with an Active Directory (AD) environment. By the end of this Playbook, you'll be able to authenticate Debian users with AD credentials, configure Single Sign-On (SSO), and manage sudo rules centrally from the AD server AND understand my thought process behind the configurations.

## 1. Install Required Packages

### Why:
These packages are necessary for integrating Debian with an AD environment. Each package serves a specific function related to authentication, managing users, and communication with AD.

### How:
Begin by updating your package list and installing the necessary packages:

```bash
sudo apt update
sudo apt install openssh-server realmd sssd sssd-tools libpam-sss libnss-sss libsss-sudo adcli samba-common-bin oddjob oddjob-mkhomedir krb5-kdc krb5-admin-server krb5-config
```

- **openssh-server**: Provides secure shell (SSH) access to the server.
- **realmd**: Simplifies the process of joining the machine to the domain.
- **sssd, sssd-tools**: System Security Services Daemon (SSSD) handles authentication, authorization, and access control.
- **libpam-sss, libnss-sss, libsss-sudo**: Integrate SSSD with PAM (Pluggable Authentication Module), NSS (Name Service Switch), and sudo.
- **adcli**: A tool for joining the machine to the AD domain.
- **samba-common-bin**: Provides tools to interact with Windows networking.
- **oddjob, oddjob-mkhomedir**: Automatically create home directories for AD users.
- **krb5-kdc, krb5-admin-server, krb5-config**: Packages for setting up a Kerberos Key Distribution Center (KDC), Kerberos administration server, and Kerberos configuration, which are essential for Kerberos-based authentication.

## 2. Join the Active Directory Domain

### Why:
Joining the AD domain allows the machine to be managed centrally and enables AD users to authenticate and access resources on the machine.

### How:
Discover and join your AD domain:

```bash
sudo realm discover int.spacecitycyber.com
sudo realm join --user=AD_admin_user int.spacecitycyber.com
```

You'll be prompted to enter the password for the AD admin user.

- **realm discover**: Finds available AD domains.
- **realm join**: Joins the machine to the specified AD domain.

## 3. Configure SSSD

### Why:
SSSD provides access to different identity and authentication providers. Configuring SSSD ensures that AD users can authenticate on the Debian machine and that their credentials are cached locally.

### How:
Edit the `/etc/sssd/sssd.conf` file to configure the System Security Services Daemon (SSSD):
Certainly! Here's an explanation of the `sssd.conf` file, detailing each section and parameter:

```ini
[sssd]
domains = int.spacecitycyber.com
config_file_version = 2
services = nss, pam, sudo, ssh
```

###  Section [sssd] 
- **domains**: Specifies the domains that SSSD will manage. In this case, it is `int.spacecitycyber.com`.
- **config_file_version**: Indicates the version of the configuration file. Version 2 is used here.
- **services**: Lists the services provided by SSSD. These include:
  - `nss`: Name Service Switch, for resolving user and group information.
  - `pam`: Pluggable Authentication Module, for authentication.
  - `sudo`: Provides sudo rules.
  - `ssh`: Manages SSH public keys for user authentication.

```ini
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
```

###  Section [domain/int.spacecitycyber.com]
- **ad_domain**: Specifies the Active Directory domain.
- **krb5_realm**: Defines the Kerberos realm for authentication, which is typically the uppercase version of the domain name.
- **realmd_tags**: Tags used by realmd to indicate how the domain was joined and managed.
- **cache_credentials**: Enables caching of user credentials for offline use.
- **id_provider**: Specifies that the identity provider is AD (Active Directory).
- **auth_provider**: Specifies that the authentication provider is AD.
- **chpass_provider**: Specifies that the change password provider is AD.
- **access_provider**: Specifies that the access provider is AD.
- **ldap_id_mapping**: Enables ID mapping for LDAP, which translates Windows SIDs to UNIX IDs.
- **ldap_sasl_mech**: Specifies the SASL mechanism, which is GSSAPI for Kerberos authentication.
- **ldap_sasl_authid**: Defines the SASL authentication identity, using the host's fully qualified domain name.
- **ldap_sasl_realm**: Specifies the Kerberos realm for SASL authentication.
- **ldap_account_expire_policy**: Configures the policy for account expiration based on AD settings.
- **ldap_user_extra_attrs**: Defines extra LDAP attributes for users.
- **ldap_user_ssh_public_key**: Specifies the LDAP attribute for storing SSH public keys.
- **ldap_use_tokengroups**: Enables the use of token groups for AD.
- **ad_gpo_access_control**: Enforces access control based on AD Group Policy Objects (GPO).
- **ad_gpo_map_remote_interactive**: Maps remote interactive sessions to specific applications.
- **ldap_force_upper_case_realm**: Forces the realm to uppercase.
- **enumerate**: Enables enumeration of users and groups, which allows the listing of all users and groups in the domain.
- **fallback_homedir**: Defines the default home directory template for users.
- **default_shell**: Specifies the default shell for users.
- **krb5_store_password_if_offline**: Stores passwords locally for offline authentication.
- **use_fully_qualified_names**: Requires the use of fully qualified usernames (e.g., user@domain).

```ini
[pam]
offline_credentials_expiration = 2
```

### Section [pam]
- **offline_credentials_expiration**: Specifies the duration (in days) for which offline credentials remain valid.

```ini
[sudo]
sudo_provider = ldap
ldap_sudo_search_base = ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
ldap_sudo_smart_refresh_interval = 3600
ldap_sudo_full_refresh_interval = 86400
```

### Section [sudo]
- **sudo_provider**: Specifies that sudo rules are provided via LDAP.
- **ldap_sudo_search_base**: Defines the LDAP search base for sudo rules.
- **ldap_sudo_smart_refresh_interval**: Specifies the interval (in seconds) for smart refresh of sudo rules.
- **ldap_sudo_full_refresh_interval**: Specifies the interval (in seconds) for a full refresh of sudo rules.

```ini
[ssh]
ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys
ssh_authorizedkeys_command_user = nobody
```

### Section [ssh]
- **ssh_authorizedkeys_command**: Specifies the command to retrieve authorized SSH keys for users.
- **ssh_authorizedkeys_command_user**: Defines the user that runs the command to retrieve SSH keys.

This configuration ensures that the Debian machine can properly integrate with the AD domain, authenticate users via Kerberos, manage sudo permissions centrally via LDAP, and utilize SSH keys stored in AD.

---
### Explanation of the more secure `sssd.conf` File

#### Section [sssd] 
```ini
[sssd]
domains = int.spacecitycyber.com
config_file_version = 2
services = nss, pam, sudo, ssh
```

- **domains**: Specifies the domain that SSSD should manage, in this case, `int.spacecitycyber.com`.
- **config_file_version**: Indicates the version of the configuration file format, set to `2`.
- **services**: Lists the services provided by SSSD: `nss` (Name Service Switch), `pam` (Pluggable Authentication Modules), `sudo` (sudo rules), and `ssh` (SSH keys).

#### Section [domain/int.spacecitycyber.com] 
```ini
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
```

- **ad_domain**: Specifies the Active Directory domain.
- **krb5_realm**: Specifies the Kerberos realm associated with the AD domain.
- **realmd_tags**: Metadata for Realmd integration, indicating system management and joining with `adcli`.
- **cache_credentials**: Caches credentials locally for offline use.
- **id_provider = ad**: Uses Active Directory as the identity provider.
- **auth_provider = ad**: Uses Active Directory for authentication.
- **chpass_provider = ad**: Uses Active Directory for password changes.
- **access_provider = ad**: Uses Active Directory to determine access.
- **ldap_uri = ldaps://ad-server.int.spacecitycyber.com**: Specifies the LDAP URI, using LDAPS (LDAP over SSL) for secure communication.
- **ldap_id_mapping = True**: Maps LDAP IDs to local user/group IDs.
- **ldap_sasl_mech = GSSAPI**: Uses GSSAPI for SASL (Simple Authentication and Security Layer) authentication.
- **ldap_sasl_authid = host/$(hostname -f)**: Sets the SASL authentication ID to the host's fully qualified domain name.
- **ldap_sasl_realm = INT.SPACECITYCYBER.COM**: Sets the SASL realm for Kerberos authentication.
- **ldap_account_expire_policy = ad**: Follows Active Directory's account expiration policy.
- **ldap_user_extra_attrs = altSecurityIdentities:altSecurityIdentities**: Maps additional user attributes.
- **ldap_user_ssh_public_key = altSecurityIdenties**: Uses the altSecurityIdentities attribute for storing SSH keys.
- **ldap_use_tokengroups = true**: Uses token groups for group membership.
- **ad_gpo_access_control = enforcing**: Enforces AD Group Policy Object (GPO) access control.
- **ad_gpo_map_remote_interactive = +xrdp-sesman**: Maps remote interactive sessions for GPO.
- **ldap_force_upper_case_realm = true**: Forces the realm name to uppercase.
- **enumerate = True**: Enables user/group enumeration.
- **fallback_homedir = /home/%u@%d**: Sets a fallback home directory format.
- **default_shell = /bin/bash**: Sets the default shell for users.
- **krb5_store_password_if_offline = true**: Stores Kerberos passwords for offline use.
- **use_fully_qualified_names = true**: Uses fully qualified names (user@domain).

#### Section [pam] 
```ini
[pam]
offline_credentials_expiration = 2
```

- **offline_credentials_expiration = 2**: Sets the expiration period for offline credentials to 2 days.

#### Section [sudo]
```ini
[sudo]
sudo_provider = ldap
ldap_sudo_search_base = ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
ldap_sudo_smart_refresh_interval = 3600
ldap_sudo_full_refresh_interval = 86400
```

- **sudo_provider = ldap**: Uses LDAP for sudo rules.
- **ldap_sudo_search_base = ou=SUDOers,dc=int,dc=spacecitycyber,dc=com**: Sets the base DN for searching sudo rules.
- **ldap_sudo_smart_refresh_interval = 3600**: Sets the smart refresh interval to 3600 seconds (1 hour).
- **ldap_sudo_full_refresh_interval = 86400**: Sets the full refresh interval to 86400 seconds (1 day).

#### Section [ssh] 
```ini
[ssh]
ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys
ssh_authorizedkeys_command_user = nobody
```

- **ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys**: Uses SSSD to retrieve SSH keys.
- **ssh_authorizedkeys_command_user = nobody**: Runs the command as the `nobody` user for security.

### Why This `sssd.conf` is More Secure

1. **Use of LDAPS**:
   - **ldap_uri = ldaps://ad-server.int.spacecitycyber.com**: Ensures communication with the AD server is encrypted using SSL/TLS, protecting data in transit.

2. **Kerberos Integration**:
   - **ldap_sasl_mech = GSSAPI**: Uses GSSAPI for secure authentication, leveraging Kerberos for strong security.
   - **krb5_store_password_if_offline = true**: Ensures that Kerberos credentials are stored securely for offline use, maintaining security even when the network is unavailable.

3. **Caching and Offline Support**:
   - **cache_credentials = True**: Allows caching of credentials, providing seamless authentication during network outages.
   - **offline_credentials_expiration = 2**: Sets a reasonable expiration period for offline credentials, balancing usability and security.

4. **GPO Enforcement**:
   - **ad_gpo_access_control = enforcing**: Enforces Group Policy Objects from AD, ensuring that security policies are consistently applied.

5. **User and Group Management**:
   - **ldap_id_mapping = True**: Ensures consistent mapping of LDAP IDs to local IDs.
   - **ldap_use_tokengroups = true**: Uses token groups for more efficient group membership handling.

6. **Enhanced SSH Key Management**:
   - **ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys**: Integrates SSH key management with SSSD, centralizing control and improving security.

7. **Secure Attribute Handling**:
   - **ldap_user_extra_attrs = altSecurityIdentities:altSecurityIdentities**: Securely maps additional attributes for user accounts, such as SSH keys.

### Setup on the Active Directory Side

To ensure compatibility and security on the Active Directory side, you need to perform the following configurations:

1. **Configure LDAPS**:
   - Ensure that the AD server is configured to support LDAPS. This typically involves installing an SSL certificate and enabling LDAPS in AD.

2. **Create Service Principal Names (SPNs)**:
   - Register SPNs for the services used by SSSD. For example:
     ```sh
     setspn -A host/ad-server.int.spacecitycyber.com AD_SERVER$
     ```

3. **Generate and Distribute Keytabs**:
   - Create a keytab file for the host and distribute it securely to the Linux machine. This can be done using `ktpass` on Windows:
     ```sh
     ktpass -princ host/hostname@INT.SPACECITYCYBER.COM -mapuser AD_SERVER$ -crypto AES256-SHA1 -ptype KRB5_NT_PRINCIPAL -out /path/to/host.keytab
     ```

4. **Configure User and Group Attributes**:
   - Ensure that users and groups in AD have the necessary attributes configured for use with SSSD, such as `altSecurityIdentities` for SSH keys.

5. **Group Policy Management**:
   - Create and manage GPOs that apply to the Linux systems to enforce security policies and access controls.

6. **Ensure Kerberos is Properly Configured**:
   - Make sure that the AD domain controllers are properly configured for Kerberos authentication, and that DNS is correctly set up to support Kerberos.

### Summary

This `sssd.conf` configuration enhances security by using LDAPS for encrypted communication, integrating Kerberos for strong authentication, enforcing AD GPOs, securely managing SSH keys, and supporting offline authentication. The corresponding setup on the AD side involves configuring LDAPS, creating SPNs, generating keytabs, organizing sudo rules, managing user attributes, and applying group policies to ensure a secure and well-integrated environment.

---

### **Set the appropriate permissions:**

```bash
sudo chmod 600 /etc/sssd/sssd.conf
```

### Explanation of Setting Permissions on `sssd.conf`

#### Why Set Permissions on `sssd.conf`

The `sssd.conf` file contains sensitive information that, if exposed, could compromise the security of your system. Here are the key reasons:

1. **Sensitive Information**:
   - **Credentials**: The file may contain credentials or keytabs that are used for authentication with LDAP, Active Directory, or Kerberos.
   - **Configuration Details**: Exposure of configuration details can give attackers insight into your authentication infrastructure, potentially aiding in attacks.

2. **Prevent Unauthorized Access**:
   - **Confidentiality**: Ensuring that only the root user can read and write to `sssd.conf` maintains the confidentiality of the information within.
   - **Integrity**: Preventing unauthorized users from modifying the file helps maintain the integrity of the authentication settings, avoiding potential disruptions or security loopholes.

3. **Compliance**:
   - **Security Policies**: Many organizational security policies and compliance frameworks mandate strict access controls on configuration files that contain sensitive information.

#### How to Set Permissions on `sssd.conf`

To set the appropriate permissions, use the `chmod` command as follows:

```bash
sudo chmod 600 /etc/sssd/sssd.conf
```

- **sudo**: Runs the command with superuser (root) privileges. Changing permissions on system configuration files typically requires root access.
- **chmod 600**: Changes the file mode to `600`, which sets the following permissions:
  - **6 (rw-) for the owner**: The owner of the file (usually root) has read and write permissions.
  - **0 (---) for the group**: No permissions for users in the file's group.
  - **0 (---) for others**: No permissions for other users.
- **/etc/sssd/sssd.conf**: Specifies the path to the SSSD configuration file.

### Steps to Set Permissions

1. **Open a Terminal**:
   - Access the terminal on your Linux system.

2. **Run the Command**:
   - Execute the following command to change the file permissions:
     ```bash
     sudo chmod 600 /etc/sssd/sssd.conf
     ```

3. **Verify the Permissions**:
   - To verify that the permissions have been correctly set, you can use the `ls -l` command:
     ```bash
     ls -l /etc/sssd/sssd.conf
     ```
   - The output should look like this:
     ```text
     -rw------- 1 root root <file_size> <date> /etc/sssd/sssd.conf
     ```
   - This indicates that the file is only readable and writable by the root user.

#### Summary

Setting the permissions on `sssd.conf` to `600` ensures that only the root user can read and modify the file. This is crucial for maintaining the security of sensitive information contained within the file, such as authentication credentials and configuration details. By restricting access, you protect against unauthorized access and potential security breaches, aligning with best practices for securing configuration files.

---
## 4. Start and Enable SSH Service

### Why:
SSH is used to securely connect to the server. Enabling the SSH service allows remote administration.

### How:
Start and enable the SSH service:

```bash
sudo systemctl start ssh
sudo systemctl enable ssh
```

Verify the SSH service status:

```bash
sudo systemctl status ssh
```

---
## 5. Firewall Configuration

### Why:
If a firewall is running, you need to allow SSH connections to ensure remote access to the server.

### How:
If a firewall is running, allow SSH connections on port 22:

```bash
sudo ufw allow 22/tcp
sudo ufw reload
```

---
## 6. Extend the AD Schema and Create Sudo LDAP Entries

### 6.1 Prepare the Sudo Schema LDIF File

### Why:
Extending the AD schema is necessary to store sudo rules in AD, which allows centralized management of sudo permissions.

### How:
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
### General Structure

The file is in LDIF (LDAP Data Interchange Format), used for representing LDAP directory entries and updates. This specific file is used to extend the AD schema to support sudo (superuser do) rules for managing permissions centrally from AD.

### Entry 1: sudoCommand

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
```

- **dn**: Distinguished Name. This identifies the entry's unique location in the AD hierarchy. Here, `CN=sudoCommand` indicates that this is an attribute schema entry for `sudoCommand`.
- **changetype: add**: Indicates that this entry is being added to the schema.
- **objectClass: top, attributeSchema**: Specifies that this entry is an attribute schema object.
- **lDAPDisplayName: sudoCommand**: The LDAP display name for the attribute.
- **attributeId: 1.3.6.1.4.1.15953.9.1.1**: The unique identifier for this attribute.
- **attributeSyntax: 2.5.5.12**: Defines the syntax of the attribute, which in this case is a directory string.
- **oMSyntax: 64**: Object (or directory) string syntax type.
- **isSingleValued: FALSE**: Indicates that this attribute can have multiple values.
- **cn: sudoCommand**: Common Name, another identifier for the attribute.
- **adminDescription: Command(s) that are allowed to be run by the user(s)**: A description of the attribute.

### Entry 2: sudoOption

```ldif
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
```

- **dn**: Distinguished Name for the `sudoOption` attribute.
- **changetype: add**: Adds this attribute to the schema.
- **objectClass: top, attributeSchema**: Indicates the type of LDAP object.
- **lDAPDisplayName: sudoOption**: Display name for the `sudoOption` attribute.
- **attributeId: 1.3.6.1.4.1.15953.9.1.2**: Unique identifier for this attribute.
- **attributeSyntax: 2.5.5.12**: Syntax type for this attribute (directory string).
- **oMSyntax: 64**: Directory string syntax.
- **isSingleValued: FALSE**: Attribute can have multiple values.
- **cn: sudoOption**: Common Name.
- **adminDescription: Options for sudo rules**: Description of the attribute.

### Entry 3: sudoUser

```ldif
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
```

- **dn**: Distinguished Name for the `sudoUser` attribute.
- **changetype: add**: Adds this attribute to the schema.
- **objectClass: top, attributeSchema**: Specifies the type of LDAP object.
- **lDAPDisplayName: sudoUser**: Display name for the `sudoUser` attribute.
- **attributeId: 1.3.6.1.4.1.15953.9.1.3**: Unique identifier for this attribute.
- **attributeSyntax: 2.5.5.12**: Syntax type for this attribute (directory string).
- **oMSyntax: 64**: Directory string syntax.
- **isSingleValued: FALSE**: Attribute can have multiple values.
- **cn: sudoUser**: Common Name.
- **adminDescription: User(s) allowed by sudo rule**: Description of the attribute.

### Entry 4: sudoHost

```ldif
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
```

- **dn**: Distinguished Name for the `sudoHost` attribute.
- **changetype: add**: Adds this attribute to the schema.
- **objectClass: top, attributeSchema**: Specifies the type of LDAP object.
- **lDAPDisplayName: sudoHost**: Display name for the `sudoHost` attribute.
- **attributeId: 1.3.6.1.4.1.15953.9.1.4**: Unique identifier for this attribute.
- **attributeSyntax: 2.5.5.12**: Syntax type for this attribute (directory string).
- **oMSyntax: 64**: Directory string syntax.
- **isSingleValued: FALSE**: Attribute can have multiple values.
- **cn: sudoHost**: Common Name.
- **adminDescription: Host(s) allowed by sudo rule**: Description of the attribute.

### Entry 5: sudoRole

```ldif
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

- **dn**: Distinguished Name for the `sudoRole` object class.
- **changetype: add**: Adds this object class to the schema.
- **objectClass: top, classSchema**: Specifies that this is a schema class object.
- **cn: sudoRole**: Common Name for the `sudoRole` class.
- **governsId: 1.3.6.1.4.1.15953.9.2.1**: Unique identifier for this class.
- **rDNAttID: cn**: Relative Distinguished Name attribute ID.
- **subClassOf: top**: Indicates that `sudoRole` is a subclass of the top class.
- **objectClassCategory: 1**: Indicates that this is a structural object class.
- **mayContain**: Specifies the attributes that instances of this class may contain:
  - **sudoCommand**: Commands that can be run.
  - **sudoOption**: Options for sudo rules.
  - **sudoUser**: Users allowed by the sudo rule.
  - **sudoHost**: Hosts allowed by the sudo rule.
- **adminDescription: Sudo role for users**: Description of the class.
- **possSuperiors: top**: Specifies that this class can have `top` as its superior.

#### Summary

This schema extension adds support for managing sudo rules directly in Active Directory. By defining these new attributes and the `sudoRole` class, AD can store and manage which commands users are allowed to execute, the options for these commands, the users who can execute them, and the hosts on which they can be executed. This centralizes and streamlines sudo rule management across an organization.

---
### 6.2 Import the Schema LDIF File

### Why:
Importing the schema file into AD extends the schema to include sudo attributes, allowing centralized management of sudo rules.

### How:
1. **Open Command Prompt as Administrator**:
   - Click Start, type `cmd`, right-click Command Prompt, and select "Run as Administrator".

2. **Run the `ldifde` Command to Import the Schema

**: 

```cmd
ldifde -i -f sudo.schema -c "CN=Schema,CN=Configuration,DC=X" "CN=Schema,CN=Configuration,DC=int,DC=spacecitycyber,DC=com"   
```

3. **Verify the Schema Extension**:
   - Use ADSI Edit to verify the new schema classes and attributes. Open ADSI Edit and navigate to `Schema` to ensure `sudoCommand`, `sudoOption`, `sudoUser`, `sudoHost`, and `sudoRole` are present.
  
---
### 6.3 Create Organizational Unit for Sudoers

### Why:
Creating an organizational unit (OU) for sudoers organizes and manages sudo rules within AD.

### How:
Create a file named `create_ou.ldif` with the following content:

```ldif
dn: ou=SUDOers,dc=int,dc=spacecitycyber,dc=com 
changetype: add 
objectClass: organizationalUnit 
ou: SUDOers
```

Import the LDIF file:

```bash
ldifde -i -f create_ou.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
```

Replace `admin@int.spacecitycyber.com` with the appropriate admin user.

---
### 6.4 Create Sudo Rules

### Why:
Creating sudo rules in AD allows centralized management of sudo permissions for users and groups.

### How:
Create a file named `sudoers.ldif` with the following content:

```ldif
dn: cn=defaults,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com 
changetype: add 
objectClass: top 
objectClass: sudoRole 
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

Import the LDIF file:

```bash
ldifde -i -f sudoers.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
```

Replace `admin@int.spacecitycyber.com` with the appropriate admin user.

---
## 7. Configure NSS

### Why:
NSS (Name Service Switch) is used to configure the sources from which to obtain name service information in a range of categories and to specify the order in which these sources should be queried.

### How:
Edit the `/etc/nsswitch.conf` file to include `sss`:

```text
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
#### Explanation of `nsswitch.conf`

The `nsswitch.conf` file consists of several entries, each specifying a different category of information. For each category, a list of sources (databases) is provided. These sources are queried in the order specified to find the requested information.

```text
passwd:         files systemd sss
group:          files systemd sss
shadow:         files sss
gshadow:        files
```

- **passwd**: Defines the sources for user account information. The sources are:
  - `files`: Local files such as `/etc/passwd`.
  - `systemd`: Systemd-resolved sources (e.g., dynamic user records).
  - `sss`: System Security Services Daemon (SSSD), which provides user information from remote sources like LDAP or Active Directory.

- **group**: Defines the sources for group information. Similar to `passwd`, it uses:
  - `files`: Local files such as `/etc/group`.
  - `systemd`: Systemd-resolved sources.
  - `sss`: SSSD for remote group information.

- **shadow**: Defines the sources for shadow password information (encrypted passwords). The sources are:
  - `files`: Local files such as `/etc/shadow`.
  - `sss`: SSSD for remote shadow information.

- **gshadow**: Defines the sources for group shadow information. The source is:
  - `files`: Local files such as `/etc/gshadow`.

```text
hosts:          files mdns4_minimal [NOTFOUND=return] dns
networks:       files
```

- **hosts**: Defines the sources for hostname resolution. The sources are:
  - `files`: Local files such as `/etc/hosts`.
  - `mdns4_minimal`: Multicast DNS (mDNS) for IPv4, typically used for local network device discovery.
  - `[NOTFOUND=return]`: If the previous sources do not find a match, return immediately without querying further sources.
  - `dns`: DNS servers for network-wide hostname resolution.

- **networks**: Defines the sources for network information. The source is:
  - `files`: Local files such as `/etc/networks`.

```text
sudoers:	files sss
```

- **sudoers**: Defines the sources for sudo rules. The sources are:
  - `files`: Local files such as `/etc/sudoers`.
  - `sss`: SSSD for sudo rules stored in remote sources like LDAP or Active Directory.

```text
protocols:      db files
services:       db files sss
ethers:         db files
rpc:            db files
```

- **protocols**: Defines the sources for protocol information (e.g., `/etc/protocols`). The sources are:
  - `db`: Database files.
  - `files`: Local files.

- **services**: Defines the sources for service information (e.g., `/etc/services`). The sources are:
  - `db`: Database files.
  - `files`: Local files.
  - `sss`: SSSD for remote service information.

- **ethers**: Defines the sources for Ethernet address information (e.g., `/etc/ethers`). The sources are:
  - `db`: Database files.
  - `files`: Local files.

- **rpc**: Defines the sources for RPC program number information (e.g., `/etc/rpc`). The sources are:
  - `db`: Database files.
  - `files`: Local files.

```text
netgroup:       files	nis sss
automount:      files	sss
```

- **netgroup**: Defines the sources for netgroup information. Netgroups are sets of hosts and users, often used for access control. The sources are:
  - `files`: Local files.
  - `nis`: Network Information Service (NIS), a directory service protocol for distributing system configuration data.
  - `sss`: SSSD for remote netgroup information.

- **automount**: Defines the sources for automount information. Automount is used for automatically mounting filesystems. The sources are:
  - `files`: Local files.
  - `sss`: SSSD for remote automount information.

#### Summary

This `nsswitch.conf` file configuration instructs the system to query multiple sources for different types of information. Local files are typically queried first, followed by remote sources provided by SSSD, and occasionally other services like systemd and NIS. This setup ensures both local and centralized (remote) management of user, group, host, and other system information.

---
## 8. Configure SSH to Use SSSD for Authorized Keys

### Why:
Using SSSD for authorized keys allows SSH public keys to be stored in AD, providing a central place for managing SSH keys.

### How:
### a. Add SSH Keys to AD User Attributes

Add SSH keys to the `altSecurityIdentities` attribute in AD for each user. This can be done using AD Users and Computers or a script.

### b. Edit the `sshd_config` File

Edit `/etc/ssh/sshd_config` to include:

```text
# AuthorizedKeysCommand configuration
AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
AuthorizedKeysCommandUser nobody
```

#### Explanation

1. **AuthorizedKeysCommand**:
    
    - This directive specifies a command that `sshd` will run to retrieve a user's public keys. Instead of looking for the user's public keys in the default `~/.ssh/authorized_keys` file, `sshd` runs this command and expects it to output the authorized keys for the user.
    - In this case, the command specified is `/usr/bin/sss_ssh_authorizedkeys`, which is part of SSSD. This command queries the SSSD service for the user's SSH keys, allowing the keys to be stored in a centralized directory service like LDAP or Active Directory.

2. **AuthorizedKeysCommandUser**:
    
    - This directive specifies the user under whose privileges the `AuthorizedKeysCommand` is run. Running the command as a low-privilege user (like `nobody`) enhances security by minimizing the risk of privilege escalation or other security issues.
    - Here, the command runs as the `nobody` user, which is a user account with minimal privileges.

### Why This Configuration is Used

- **Centralized Key Management**: By using SSSD to retrieve SSH keys, keys can be managed centrally in a directory service. This simplifies key management, especially in environments with many users and servers.
- **Enhanced Security**: Storing SSH keys in a directory service and accessing them through SSSD ensures that keys are managed consistently and securely. The use of `AuthorizedKeysCommandUser` to run the command as `nobody` adds an additional layer of security.
- **Flexibility**: This configuration allows for more flexibility in key management. Administrators can update a user's SSH keys in the directory service without needing to access each server individually.

#### Summary

The given snippet configures the SSH server to use a command provided by SSSD to retrieve authorized SSH keys from a centralized directory service. The command runs with minimal privileges for enhanced security. This setup streamlines key management and improves security in environments where centralized management of SSH keys is desired.

---
## 9. Enable and Configure PAM

### Why:
PAM (Pluggable Authentication Modules) provides a way to develop programs that are independent of authentication scheme. Configuring PAM ensures that all authentication requests are processed through a common set of modules.

### How:
Ensure that PAM is enabled and configured in `/etc/pam.d/sshd`:

```text
#%PAM-1.0
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
### PAM Control Flags and Modules

- **auth**: Handles authentication tasks.
- **account**: Manages account-related tasks.
- **password**: Manages password changes.
- **session**: Manages tasks performed before/after establishing a user session.

### Modules and Their Functions

1. **auth modules**:
    
    - **pam_sepermit.so**: Allows or denies login based on SELinux policy.
    - **include password-auth**: Includes configuration from the `password-auth` file, which typically contains common authentication settings.
    - **pam_env.so**: Sets up user environment variables.
    - **pam_sss.so**: Uses SSSD for authentication against centralized directories like LDAP or AD.
    - **pam_deny.so**: Denies access if previous modules fail (security measure).
2. **account modules**:
    
    - **pam_sss.so**: Uses SSSD to retrieve account information from centralized directories.
    - **pam_unix.so**: Performs standard Unix authentication, such as checking `/etc/passwd` and `/etc/shadow`.
    - **pam_nologin.so**: Prevents non-root users from logging in if `/etc/nologin` exists.
    - **include password-auth**: Includes additional account management settings from `password-auth`.
3. **password modules**:
    
    - **pam_sss.so**: Uses SSSD for password management and updates.
    - **pam_unix.so**: Standard Unix password management.
    - **include password-auth**: Includes additional password management settings from `password-auth`.
4. **session modules**:
    
    - **pam_limits.so**: Sets resource limits for the session.
    - **pam_unix.so**: Standard session management, such as setting up utmp/wtmp entries.
    - **pam_sss.so**: Manages session-related tasks through SSSD.
    - **pam_selinux.so close**: Manages SELinux context closing at the end of a session.
    - **pam_loginuid.so**: Sets the login UID for the session.
    - **pam_keyinit.so force revoke**: Initializes or revokes kernel keyrings.
    - **include password-auth**: Includes additional session settings from `password-auth`.
    - **pam_selinux.so open env_params**: Manages SELinux context opening at the beginning of a session.
    - **pam_motd.so**: Displays the message of the day.
    - **pam_mail.so standard**: Notifies the user of new mail.
    - **pam_oddjob_mkhomedir.so skel=/etc/skel umask=077**: Automatically creates home directories for users if they do not exist, using `/etc/skel` as a template and setting the specified umask.
### Control Flags

Control flags in PAM (Pluggable Authentication Modules) define the behavior of the module stack during the authentication process. Understanding when and why to use different control flags (required, include, sufficient, and optional) helps in configuring PAM to achieve the desired security and functionality. Here’s a detailed explanation:


1. **required**:
   - **Description**: The module must succeed for the overall result to be considered successful. If it fails, the user will not be authenticated, but the process continues to evaluate other modules.
   - **Usage**: Used when a module performs a critical security check that must not be bypassed.
   - **Example**: `auth required pam_deny.so` ensures that if any previous module in the stack fails, access is denied after all modules are checked.

2. **include**:
   - **Description**: Includes the PAM configuration from another file. This helps in modularizing the PAM configuration, making it easier to manage and reuse common settings.
   - **Usage**: Used to avoid repetition and maintain consistency across different PAM service configurations.
   - **Example**: `auth include password-auth` includes the authentication settings from the `password-auth` file, ensuring that common authentication rules are applied.

3. **sufficient**:
   - **Description**: If the module succeeds and no previous `required` module has failed, the overall result is considered successful, and no further modules in the stack are evaluated. If it fails, the process continues to evaluate other modules.
   - **Usage**: Used when a module provides an alternative authentication method that, if successful, can bypass other checks.
   - **Example**: `auth sufficient pam_sss.so` allows SSSD to authenticate the user. If successful, no further authentication modules are checked.

4. **optional**:
   - **Description**: The module's success or failure does not affect the overall result. It is used for optional checks or logging.
   - **Usage**: Used when a module performs non-critical checks or provides additional information that does not impact the authentication result.
   - **Example**: `session optional pam_motd.so` displays the message of the day, which is informative but not critical to the authentication process.

### Why Use Certain Control Flags Over Others

- **required**:
  - **Why**: Ensures that essential security checks are always performed. Even if a required module fails, the process continues to provide more information about potential failures, but ultimately access is denied.
  - **Example**: `auth required pam_unix.so` ensures that standard Unix authentication is always checked.

- **include**:
  - **Why**: Promotes modular and maintainable configurations by including common settings from other files, reducing redundancy.
  - **Example**: `auth include password-auth` helps in reusing a common authentication policy across different services.

- **sufficient**:
  - **Why**: Optimizes the authentication process by allowing successful authentication to short-circuit further checks, which can improve performance and user experience.
  - **Example**: `auth sufficient pam_sss.so` allows centralized authentication via SSSD to bypass further local checks if successful.

- **optional**:
  - **Why**: Adds flexibility by allowing non-critical modules to run without impacting the overall authentication result. Useful for logging, setting environment variables, or displaying messages.
  - **Example**: `session optional pam_mail.so` provides mail notification functionality without affecting session establishment.

### Practical Example

Let’s consider a practical example where we combine these control flags to achieve a robust PAM configuration:

```text
auth       required     pam_sepermit.so
auth       include      password-auth
auth       required     pam_env.so
auth       sufficient   pam_sss.so
auth       required     pam_deny.so
```

- **pam_sepermit.so** (`required`): Ensures SELinux policy is enforced.
- **password-auth** (`include`): Reuses common authentication settings.
- **pam_env.so** (`required`): Sets up environment variables.
- **pam_sss.so** (`sufficient`): Allows SSSD authentication to short-circuit further checks if successful.
- **pam_deny.so** (`required`): Ensures access is denied if any previous required module fails.
#### Summary

This `pam.d/sshd` configuration file ensures that a comprehensive set of authentication, account, password, and session management tasks are performed for SSH sessions. It combines standard Unix methods with SSSD to provide centralized authentication and account management. Key features include:

- **Authentication**: Combines SELinux policy enforcement, environment variable setup, and SSSD for centralized authentication.
- **Account Management**: Uses SSSD and standard Unix methods to check user accounts and manage login permissions.
- **Password Management**: Supports password changes using both SSSD and standard Unix methods.
- **Session Management**: Sets resource limits, handles SELinux contexts, manages user environment and login UID, displays messages, and creates user home directories if needed.

Control flags in PAM allow fine-tuning of the authentication process to balance security, performance, and user experience. Understanding when to use `required`, `include`, `sufficient`, and `optional` helps in designing effective and maintainable authentication policies.

This configuration enhances security and flexibility by integrating centralized directory services and ensuring robust session management

---
### Edit `/etc/pam.d/common-session` to include:

```text
session	[default=1]			pam_permit.so
session	requisite			pam_deny.so
session	required			pam_permit.so
session optional			pam_umask.so
session	required	pam_unix.so 
session	optional			pam_sss.so 
session	optional	pam_systemd.so 
session	optional			pam_mkhomedir.so 
session required pam_oddjob_mkhomedir.so skel=/etc/skel umask=0077
```
### Explanation of `pam.d/common-session` File

Each line in this file specifies a PAM module that performs a specific session management task. The control flags (`default`, `requisite`, `required`, `optional`) determine how each module's result affects the overall session setup.

```text
session	[default=1]			pam_permit.so
```

- **session**: Indicates this is a session management task.
- **[default=1]**: This control flag indicates that the next module should be skipped if this module succeeds. Here, it is used to prime the stack with a positive return value.
- **pam_permit.so**: This module always succeeds, effectively ensuring that the session stack has a positive starting point.

```text
session	requisite			pam_deny.so
```

- **session**: Session management task.
- **requisite**: If this module fails, the remaining modules are not executed, and the session setup fails immediately.
- **pam_deny.so**: This module always fails. It is typically used to ensure that certain conditions (if configured earlier) cause an immediate failure.

```text
session	required			pam_permit.so
```

- **session**: Session management task.
- **required**: This module must succeed for the overall session setup to succeed. If it fails, the session setup will fail, but the process continues to evaluate other modules.
- **pam_permit.so**: This module always succeeds, ensuring that the session can continue to the next steps.

```text
session optional			pam_umask.so
```

- **session**: Session management task.
- **optional**: The success or failure of this module does not affect the overall session setup.
- **pam_umask.so**: Sets the user file-creation mask, defining default permissions for new files.

```text
session	required	pam_unix.so 
```

- **session**: Session management task.
- **required**: This module must succeed for the session setup to succeed.
- **pam_unix.so**: Standard Unix authentication, sets up user sessions according to traditional Unix methods.

```text
session	optional			pam_sss.so 
```

- **session**: Session management task.
- **optional**: The success or failure of this module does not affect the overall session setup.
- **pam_sss.so**: Uses System Security Services Daemon (SSSD) for session management, allowing integration with remote directories like LDAP or AD.

```text
session	optional	pam_systemd.so 
```

- **session**: Session management task.
- **optional**: The success or failure of this module does not affect the overall session setup.
- **pam_systemd.so**: Integrates session management with systemd, ensuring that user sessions are tracked and managed by the systemd init system.

```text
session	optional			pam_mkhomedir.so 
```

- **session**: Session management task.
- **optional**: The success or failure of this module does not affect the overall session setup.
- **pam_mkhomedir.so**: Automatically creates a user's home directory if it does not exist when the user logs in.

```text
session required pam_oddjob_mkhomedir.so skel=/etc/skel umask=0077
```

- **session**: Session management task.
- **required**: This module must succeed for the session setup to succeed.
- **pam_oddjob_mkhomedir.so**: Another module to create home directories for users if they do not exist, similar to `pam_mkhomedir.so`.
  - **skel=/etc/skel**: Specifies the skeleton directory, which contains default files copied to the new home directory.
  - **umask=0077**: Sets the file-creation mask, ensuring that new directories and files are created with restricted permissions (only accessible by the user).
### Additional Modules and Their Purposes

1. **pam_limits.so**:
   - **Purpose**: Sets resource limits for user sessions (e.g., maximum number of open files, CPU usage).
   - **Example**: `session required pam_limits.so`

2. **pam_env.so**:
   - **Purpose**: Sets environment variables for the user session. It can load variables from files like `/etc/environment` or `/etc/security/pam_env.conf`.
   - **Example**: `session required pam_env.so`

3. **pam_lastlog.so**:
   - **Purpose**: Updates and displays the last login time of the user. This is useful for security monitoring.
   - **Example**: `session optional pam_lastlog.so showfailed`

4. **pam_motd.so**:
   - **Purpose**: Displays the message of the day (MOTD) to the user upon login.
   - **Example**: `session optional pam_motd.so`

5. **pam_mail.so**:
   - **Purpose**: Notifies users of new mail in their mailbox.
   - **Example**: `session optional pam_mail.so standard`

6. **pam_loginuid.so**:
   - **Purpose**: Sets the login UID for the session, which is used for auditing and tracking purposes.
   - **Example**: `session required pam_loginuid.so`

7. **pam_ck_connector.so**:
   - **Purpose**: Registers user sessions with ConsoleKit, a framework for defining and tracking users, sessions, and seats.
   - **Example**: `session optional pam_ck_connector.so nox11`

8. **pam_systemd.so**:
   - **Purpose**: Integrates session management with systemd, ensuring that user sessions are tracked and managed by the systemd init system.
   - **Example**: `session optional pam_systemd.so`

9. **pam_ecryptfs.so**:
   - **Purpose**: Sets up encrypted home directories using eCryptfs.
   - **Example**: `session optional pam_ecryptfs.so unwrap`

10. **pam_exec.so**:
    - **Purpose**: Runs an external command during the session setup or teardown.
    - **Example**: `session optional pam_exec.so /path/to/command`

11. **pam_krb5.so**:
    - **Purpose**: Manages Kerberos tickets for the session.
    - **Example**: `session optional pam_krb5.so`

12. **pam_namespace.so**:
    - **Purpose**: Configures namespace isolation, useful for sandboxing user sessions.
    - **Example**: `session required pam_namespace.so`

13. **pam_permit.so**:
    - **Purpose**: Always succeeds; often used to allow access in a specific context.
    - **Example**: `session required pam_permit.so`

14. **pam_deny.so**:
    - **Purpose**: Always fails; used to deny access in a specific context.
    - **Example**: `session requisite pam_deny.so`

15. **pam_selinux.so**:
    - **Purpose**: Manages SELinux user contexts during session setup and teardown.
    - **Example**: `session required pam_selinux.so open`
    
16. **pam_keyinit.so**:
    - **Purpose**: Manages kernel keyrings during session setup and teardown.
    - **Example**: `session optional pam_keyinit.so force revoke`

### Example `common-session` Configuration with Additional Modules

Here is an example `common-session` configuration file that includes several of these additional modules:

```text
session    [default=1]    pam_permit.so
session    requisite      pam_deny.so
session    required       pam_permit.so
session    optional       pam_umask.so
session    required       pam_unix.so
session    optional       pam_sss.so
session    optional       pam_systemd.so
session    optional       pam_mkhomedir.so
session    required       pam_oddjob_mkhomedir.so skel=/etc/skel umask=0077
session    required       pam_limits.so
session    required       pam_env.so
session    optional       pam_lastlog.so showfailed
session    optional       pam_motd.so
session    optional       pam_mail.so standard
session    required       pam_loginuid.so
session    optional       pam_ck_connector.so nox11
session    optional       pam_ecryptfs.so unwrap
session    optional       pam_exec.so /path/to/command
session    optional       pam_krb5.so
session    required       pam_namespace.so
session    required       pam_selinux.so open
session    optional       pam_keyinit.so force revoke
```

### Summary


The `pam.d/common-session` file configures session-related tasks that are executed when a user logs in or out. It includes:

- **pam_permit.so**: Ensures a positive start and required success.
- **pam_deny.so**: Causes immediate failure if a certain condition is met (though here it seems to be used for structure rather than effect).
- **pam_umask.so**: Sets default file permissions.
- **pam_unix.so**: Handles standard Unix session setup.
- **pam_sss.so**: Manages sessions using SSSD for centralized authentication.
- **pam_systemd.so**: Integrates with systemd for session tracking.
- **pam_mkhomedir.so** and **pam_oddjob_mkhomedir.so**: A.utomatically create home directories for users if they do not exist, using default settings from the skeleton directory.

The `pam.d/common-session` configuration file is highly flexible and allows you to control various aspects of session management through a wide range of PAM modules. By understanding and appropriately configuring these modules, you can ensure secure and efficient session setup and teardown processes tailored to your system's needs.

---
### Edit `/etc/pam.d/password-auth` to include:

```text
password   requisite    pam_pwquality.so retry=3
password   [success=1 default=ignore] pam_unix.so obscure use_authtok try_first_pass yescrypt
password   required     pam_deny.so
```
### Explanation of `pam.d/password-auth` File

Each line in this file specifies a PAM module that performs a specific password-related task. The control flags (`requisite`, `[success=1 default=ignore]`, `required`) determine how each module's result affects the overall password authentication process.

```text
password   requisite    pam_pwquality.so retry=3
```

- **password**: Indicates this is a password management task.
- **requisite**: If this module fails, the remaining modules are not executed, and the overall result is a failure. However, the failure is reported immediately.
- **pam_pwquality.so**: This module enforces password quality requirements to ensure strong passwords. It checks the complexity and strength of the new passwords.
  - **retry=3**: Specifies that the user is allowed three attempts to enter a strong password before the operation fails.

### Why Use `pam_pwquality.so`:
- **Enforcing Password Policies**: Ensures that users create strong, complex passwords, which enhances security by reducing the likelihood of successful brute-force attacks or password guessing.

```text
password   [success=1 default=ignore] pam_unix.so obscure use_authtok try_first_pass yescrypt
```

- **password**: Indicates this is a password management task.
- **[success=1 default=ignore]**: This control flag is an advanced syntax that indicates if the module succeeds, skip the next module (`pam_deny.so`); otherwise, ignore this result and proceed to the next module. This effectively means if `pam_unix.so` is successful, it will skip the next line, which denies access.
- **pam_unix.so**: This module performs standard Unix password management tasks, including authentication, updating passwords, and hashing.
  - **obscure**: Applies additional checks to ensure passwords are not too simple or easily guessable.
  - **use_authtok**: Uses the authentication token (password) that was entered earlier in the stack, avoiding asking the user to re-enter the password.
  - **try_first_pass**: Tries the password from the first pass before prompting the user.
  - **yescrypt**: Specifies the use of the yescrypt hashing algorithm for storing passwords securely.

### Why Use `pam_unix.so`:
- **Standard Unix Authentication**: Ensures compatibility with traditional Unix password management, making use of well-established methods for verifying and storing passwords.

```text
password   required     pam_deny.so
```

- **password**: Password management task.
- **required**: This module must succeed for the overall result to be considered successful. Since `pam_deny.so` always fails, its presence here ensures that if the control flow reaches this module, the operation is denied.
- **pam_deny.so**: This module always fails. It is used to enforce failure in case the preceding module(s) did not succeed.

### Why Use `pam_deny.so`:
- **Security Measure**: Acts as a safeguard to deny access if earlier modules fail or if the control flow should not reach this point, ensuring that only successful authentication processes allow access.

### Summary

This `pam.d/password-auth` configuration ensures robust password authentication and management by combining several key features:

1. **Enforcing Password Quality**:
   - `pam_pwquality.so`: Ensures users create strong and complex passwords with three retry attempts.

2. **Standard Unix Password Management**:
   - `pam_unix.so`: Manages traditional Unix password checks and updates, using secure hashing algorithms and ensuring passwords are not easily guessable.

3. **Security Fail-Safe**:
   - `pam_deny.so`: Ensures that if the control flow reaches this point without a successful authentication, access is denied.

### Example Use Case

When a user attempts to change their password, the following sequence occurs:
1. **pam_pwquality.so**: First checks the password strength. If it fails, the process stops, and the user is denied the password change after three attempts.
2. **pam_unix.so**: If the password is strong enough, this module then performs the standard Unix password management tasks. If successful, the process skips the next module (`pam_deny.so`).
3. **pam_deny.so**: If reached, this module denies the operation, ensuring that any failure in the previous steps results in access being denied.

This configuration provides a balance between enforcing strong password policies and ensuring compatibility with traditional Unix password management, while also incorporating a fail-safe to deny access if necessary.

---
### Complete Example of `sshd_config`

Here’s a complete example of your `sshd_config` file:

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
### Explanation of `sshd_config` File

Let's break down and explain each part of the `sshd_config` file, which configures the behavior of the SSH daemon (`sshd`). This file controls various aspects of how SSH connections are handled on the server.

```text
# This is the sshd server system-wide configuration file.  See
# sshd_config(5) for more information.
```

This comment indicates that the file is the global configuration file for the SSH daemon and refers to the man page `sshd_config(5)` for more details.

#### Basic Settings

```text
Port 22
AddressFamily any
ListenAddress 0.0.0.0
ListenAddress ::
```

- **Port 22**: Specifies the port number that `sshd` listens on. Port 22 is the default for SSH.
- **AddressFamily any**: Allows `sshd` to listen on both IPv4 and IPv6 addresses.
- **ListenAddress 0.0.0.0**: Listens on all available IPv4 addresses.
- **ListenAddress ::**: Listens on all available IPv6 addresses.

```text
# The default requires explicit activation of protocol 1
Protocol 2
```

- **Protocol 2**: Enforces the use of SSH protocol version 2, which is more secure than version 1.

#### Host Keys

```text
# HostKey for protocol version 1
# HostKey /etc/ssh/ssh_host_key
# HostKeys for protocol version 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_dsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
```

- **HostKey**: Specifies the files containing the private keys used by `sshd` for different cryptographic algorithms (RSA, DSA, ECDSA, Ed25519).

#### Key Generation and Ciphers

```text
# Lifetime and size of ephemeral version 1 server key
# KeyRegenerationInterval 1h
# ServerKeyBits 1024

# Ciphers and keying
# RekeyLimit default none
```

- **KeyRegenerationInterval**: Sets the time after which the ephemeral server key is regenerated (commented out here).
- **ServerKeyBits**: Defines the size of the server key (commented out here).
- **RekeyLimit**: Specifies how often the keys are renegotiated during a session (commented out here).

#### Logging

```text
# Logging
# obsoletes QuietMode and FascistLogging
SyslogFacility AUTH
LogLevel VERBOSE
```

- **SyslogFacility AUTH**: Logs messages to the AUTH facility of syslog.
- **LogLevel VERBOSE**: Sets the verbosity level of logging to VERBOSE, providing detailed information.

#### Authentication

```text
# Authentication:

LoginGraceTime 2m
PermitRootLogin prohibit-password
StrictModes yes
MaxAuthTries 5
MaxSessions 10
```

- **LoginGraceTime 2m**: Sets the time allowed for successful authentication before disconnecting (2 minutes).
- **PermitRootLogin prohibit-password**: Allows root login only with public key authentication, not with passwords.
- **StrictModes yes**: Ensures strict checking of key file and directory permissions.
- **MaxAuthTries 5**: Limits the number of authentication attempts per connection to 5.
- **MaxSessions 10**: Limits the number of open sessions permitted per connection to 10.

#### Public Key Authentication

```text
#RSAAuthentication no
PubkeyAuthentication yes

# The default is to check both .ssh/authorized_keys and .ssh/authorized_keys2
# but this is overridden so installations will only check .ssh/authorized_keys
AuthorizedKeysFile     .ssh/authorized_keys .ssh/authorized_keys2
```

- **PubkeyAuthentication yes**: Enables public key authentication.
- **AuthorizedKeysFile**: Specifies the files that contain the authorized public keys for users.

#### Host-Based Authentication

```text
#AuthorizedPrincipalsFile none

# For this to work you will also need host keys in /etc/ssh/ssh_known_hosts
#HostbasedAuthentication no
# Change to yes if you don't trust ~/.ssh/known_hosts for
# HostbasedAuthentication
#IgnoreUserKnownHosts no
# Don't read the user's ~/.rhosts and ~/.shosts files
IgnoreRhosts yes
```

- **AuthorizedPrincipalsFile**: Specifies a file that lists principals for host-based authentication (commented out).
- **HostbasedAuthentication**: Allows host-based authentication (commented out and set to no).
- **IgnoreRhosts yes**: Ignores `.rhosts` and `.shosts` files for host-based authentication.

#### Password and Challenge-Response Authentication

```text
# To disable tunneled clear text passwords, change to no here!
PasswordAuthentication yes
#PermitEmptyPasswords no
#PasswordAuthentication no

# Change to no to disable s/key passwords
ChallengeResponseAuthentication no
```

- **PasswordAuthentication yes**: Allows password-based authentication.
- **PermitEmptyPasswords no**: Disallows empty passwords (commented out, default is no).
- **ChallengeResponseAuthentication no**: Disables challenge-response authentication.

#### Kerberos and GSSAPI Authentication

```text
# Kerberos options
KerberosAuthentication yes
KerberosOrLocalPasswd yes
KerberosTicketCleanup yes
#KerberosGetAFSToken no

# GSSAPI options
GSSAPIAuthentication yes
GSSAPICleanupCredentials yes
```

- **KerberosAuthentication yes**: Enables Kerberos authentication.
- **KerberosOrLocalPasswd yes**: Falls back to local password authentication if Kerberos authentication fails.
- **KerberosTicketCleanup yes**: Automatically destroys user Kerberos tickets upon logout.
- **GSSAPIAuthentication yes**: Enables GSSAPI authentication.
- **GSSAPICleanupCredentials yes**: Cleans up GSSAPI credentials on logout.

#### PAM Integration

```text
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
```

- **UsePAM yes**: Enables PAM (Pluggable Authentication Modules) for authentication, account, and session management.

#### Additional Options

```text
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
```

- **AllowAgentForwarding yes**: Allows SSH agent forwarding (commented out, default is yes).
- **AllowTcpForwarding yes**: Allows TCP forwarding (commented out, default is yes).
- **GatewayPorts no**: Disallows remote hosts to connect to ports forwarded for the client (commented out, default is no).
- **X11Forwarding yes**: Allows X11 forwarding (commented out, default is yes).
- **X11DisplayOffset 10**: Sets the offset for X11 display (commented out, default is 10).
- **X11UseLocalhost yes**: Restricts X11 forwarding to the local interface (commented out, default is yes).
- **PermitTTY yes**: Allows TTY allocation (commented out, default is yes).
- **PrintMotd yes**: Prints the message of the day upon login (commented out, default is yes).
- **PrintLastLog yes**: Prints the last login time (commented out, default is yes).
- **TCPKeepAlive yes**: Enables TCP keep-alive messages (commented out, default is yes).
- **UseLogin no**: Disables the use of `/bin/login` for user sessions (commented out, default is no).
- **PermitUserEnvironment no**: Disallows the use of user environment settings (commented out, default is no).
- **Compression delayed**: Delays compression until after authentication (commented out, default is delayed).
- **ClientAliveInterval 0**: Disables client keep-alive messages (commented out, default is 0).
- **ClientAliveCountMax 3**: Sets the number of client alive messages that can be sent without a response (commented out, default is 3).
- **UseDNS no**: Disables DNS lookups for client hostnames (commented out, default is no).
- **PidFile /var/run/sshd.pid**: Specifies the file for storing the SSH daemon's PID (commented out, default is `/var/run/sshd.pid`).
- **MaxStartups 10:30:100**: Limits the number of concurrent

 unauthenticated connections (commented out, default is `10:30:100`).
- **PermitTunnel no**: Disallows tunneling (commented out, default is no).
- **ChrootDirectory none**: Disables chroot for users (commented out, default is none).
- **VersionAddendum none**: Removes the version addendum from the SSH banner (commented out, default is none).
- **Banner none**: Specifies a file to display before login (commented out, default is none).

#### Environment and Subsystem

```text
# Allow client to pass locale environment variables
AcceptEnv LANG LC_*

# override default of no subsystems
Subsystem   sftp    /usr/lib/openssh/sftp-server
```

- **AcceptEnv LANG LC_***: Allows clients to pass locale environment variables.
- **Subsystem sftp /usr/lib/openssh/sftp-server**: Defines the SFTP subsystem and the path to the SFTP server binary.

#### Per-User Settings Example

```text
# Example of overriding settings on a per-user basis
# Match User anoncvs
#   X11Forwarding no
#   AllowTcpForwarding no
#   PermitTTY no
#   ForceCommand cvs server
```

- **Match User anoncvs**: Example block to override settings for a specific user.
- **X11Forwarding no**: Disables X11 forwarding for the `anoncvs` user.
- **AllowTcpForwarding no**: Disables TCP forwarding for the `anoncvs` user.
- **PermitTTY no**: Disallows TTY allocation for the `anoncvs` user.
- **ForceCommand cvs server**: Forces the `cvs server` command for the `anoncvs` user.

#### AuthorizedKeysCommand Configuration

```text
# AuthorizedKeysCommand configuration
AuthorizedKeysCommand /usr/bin/sss_ssh_authorizedkeys
AuthorizedKeysCommandUser nobody
```

- **AuthorizedKeysCommand**: Specifies a command to retrieve a user's public keys. Here, it uses `/usr/bin/sss_ssh_authorizedkeys`, which integrates with SSSD.
- **AuthorizedKeysCommandUser nobody**: Runs the command as the `nobody` user for security reasons.

#### Summary

This `sshd_config` file configures various aspects of the SSH daemon, including network settings, authentication methods, logging, and session behavior. Key configurations include:

- Listening on all IP addresses (IPv4 and IPv6).
- Using SSH protocol version 2.
- Enabling public key authentication and Kerberos/GSSAPI authentication.
- Configuring various security settings like `PermitRootLogin` and `MaxAuthTries`.
- Enabling PAM for authentication and session management.
- Integrating with SSSD for retrieving authorized keys.

These settings ensure a secure, flexible, and robust SSH server configuration.

---
### For enhanced security, you can make further adjustments:

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

LoginGraceTime 1m
PermitRootLogin prohibit-password
StrictModes yes
MaxAuthTries 3
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
### Explanation of the New `sshd_config` File

Let's break down this `sshd_config` file and explain why it is more secure compared to the previous configuration.

```text
# This is the sshd server system-wide configuration file.  See
# sshd_config(5) for more information.

Port 22
AddressFamily any
ListenAddress 0.0.0.0
ListenAddress ::
```

- **Port 22**: Default SSH port.
- **AddressFamily any**: Allows both IPv4 and IPv6 addresses.
- **ListenAddress 0.0.0.0** and **ListenAddress ::**: Listens on all available network interfaces for both IPv4 and IPv6.

```text
# The default requires explicit activation of protocol 1
Protocol 2
```

- **Protocol 2**: Enforces the use of SSH protocol version 2, which is more secure.

### Host Keys

```text
# HostKey for protocol version 1
# HostKey /etc/ssh/ssh_host_key
# HostKeys for protocol version 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_dsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key
```

- **HostKey**: Specifies private key files for various cryptographic algorithms used by SSH.

### Key Generation and Ciphers

```text
# Lifetime and size of ephemeral version 1 server key
# KeyRegenerationInterval 1h
# ServerKeyBits 1024

# Ciphers and keying
# RekeyLimit default none
```

- **KeyRegenerationInterval** and **ServerKeyBits**: Comments suggest legacy settings for ephemeral keys (not used).
- **RekeyLimit**: No rekey limit specified (default).

### Logging

```text
# Logging
# obsoletes QuietMode and FascistLogging
SyslogFacility AUTH
LogLevel VERBOSE
```

- **SyslogFacility AUTH**: Logs messages to the AUTH facility of syslog.
- **LogLevel VERBOSE**: Provides detailed logging for better security auditing.

### Authentication

```text
LoginGraceTime 1m
PermitRootLogin prohibit-password
StrictModes yes
MaxAuthTries 3
MaxSessions 10
```

- **LoginGraceTime 1m**: Shortens the grace time for login to 1 minute, reducing the window for unauthorized attempts.
- **PermitRootLogin prohibit-password**: Disallows root login with passwords, allowing only key-based root logins.
- **StrictModes yes**: Enforces strict permission checking on key files.
- **MaxAuthTries 3**: Reduces the number of authentication attempts to 3, limiting brute force attempts.
- **MaxSessions 10**: Limits the number of sessions to 10 per connection.

### Public Key Authentication

```text
#RSAAuthentication no
PubkeyAuthentication yes

# The default is to check both .ssh/authorized_keys and .ssh/authorized_keys2
# but this is overridden so installations will only check .ssh/authorized_keys
AuthorizedKeysFile     .ssh/authorized_keys
```

- **PubkeyAuthentication yes**: Enables public key authentication.
- **AuthorizedKeysFile**: Only uses `.ssh/authorized_keys`, simplifying key management and reducing attack surface.

### Host-Based Authentication

```text
#AuthorizedPrincipalsFile none

# For this to work you will also need host keys in /etc/ssh/ssh_known_hosts
#HostbasedAuthentication no
# Change to yes if you don't trust ~/.ssh/known_hosts for
# HostbasedAuthentication
#IgnoreUserKnownHosts no
# Don't read the user's ~/.rhosts and ~/.shosts files
IgnoreRhosts yes
```

- **HostbasedAuthentication**: Disabled for security.
- **IgnoreRhosts yes**: Ensures `.rhosts` files are ignored, reducing risk from insecure host-based authentication.

### Password and Challenge-Response Authentication

```text
# To disable tunneled clear text passwords, change to no here!
PasswordAuthentication no
PermitEmptyPasswords no

# Change to no to disable s/key passwords
ChallengeResponseAuthentication no
```

- **PasswordAuthentication no**: Disables password authentication, forcing the use of more secure methods like public key authentication.
- **PermitEmptyPasswords no**: Disallows empty passwords, enhancing security.
- **ChallengeResponseAuthentication no**: Disables challenge-response authentication, preventing potential vulnerabilities.

### Kerberos and GSSAPI Authentication

```text
# Kerberos options
KerberosAuthentication yes
KerberosOrLocalPasswd yes
KerberosTicketCleanup yes
#KerberosGetAFSToken no

# GSSAPI options
GSSAPIAuthentication yes
GSSAPICleanupCredentials yes
GSSAPIKeyExchange yes # Enable GSSAPI key exchange for better security
```

- **KerberosAuthentication yes**: Enables Kerberos authentication.
- **KerberosOrLocalPasswd yes**: Falls back to local password authentication if Kerberos fails.
- **KerberosTicketCleanup yes**: Cleans up Kerberos tickets on logout.
- **GSSAPIAuthentication yes**: Enables GSSAPI for secure single sign-on.
- **GSSAPICleanupCredentials yes**: Cleans up GSSAPI credentials on logout.
- **GSSAPIKeyExchange yes**: Enables GSSAPI key exchange for added security.

### PAM Integration

```text
UsePAM yes
```

- **UsePAM yes**: Enables PAM for authentication, account, and session management, allowing integration with various security policies and modules.

### Agent Forwarding and TCP Forwarding

```text
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
```

- **AllowAgentForwarding no**: Disables SSH agent forwarding, reducing risk from forwarded agent access.
- **PermitRootLogin prohibit-password**: Reiterated from above, enhancing root login security.
- **PermitUserEnvironment no**: Prevents users from setting environment variables, reducing risk of environment-based attacks.
- **Compression delayed**: Delays compression until after authentication, preventing certain types of attacks.
- **ClientAliveInterval 300**: Sends a keepalive message every 300 seconds to ensure session liveness.
- **ClientAliveCountMax 2**: Disconnects after 2 missed keepalive messages, reducing the chance of hanging sessions.
- **UseDNS no**: Disables DNS lookups to speed up authentication and prevent certain attacks.

### Environment and Subsystem

```text
# no default banner path
#Banner none

# Allow client to pass locale environment variables
AcceptEnv LANG LC_*

# override default of no subsystems
Subsystem   sftp    /usr/lib/openssh/sftp-server
```

- **AcceptEnv LANG LC_***: Allows locale environment variables to be passed, useful for internationalization.
- **Subsystem sftp /usr/lib/openssh/sftp-server**: Defines the SFTP subsystem, enabling file transfer over SSH.

### Per-User Settings Example

```text
# Example of overriding settings on a per-user basis
# Match User anoncvs
#   X11Forwarding no
#   AllowTcpForwarding no
#   PermitTTY no
#   ForceCommand cvs server
```

- **Match User anoncvs**: Example configuration to override settings for a specific user, demonstrating flexibility in security policies.

### AuthorizedKeysCommand Configuration

```text
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

- **AuthorizedKeysCommand**: Uses `sss_ssh_authorizedkeys` from SSSD to retrieve user keys, improving central key management.
- **AuthorizedKeysCommandUser nobody**: Runs the command with minimal privileges for security.

#### Summary of Security Improvements

1. **LoginGraceTime 1m**: Reduces the time window for login attempts, minimizing exposure to brute force attacks.
2. **MaxAuthTries 3**: Limits the number of authentication attempts, reducing the risk of brute force attacks.
3. **PasswordAuthentication no**: Disables password authentication, enforcing the use of more secure methods like public key authentication.
4. **PermitEmptyPasswords no**: Ensures that empty passwords are not allowed, enhancing security.
5. **ChallengeResponseAuthentication no**: Disables less secure challenge-response authentication.
6. **AllowAgentForwarding no**: Disables SSH agent forwarding unless necessary, reducing risk from agent-based attacks.
7. **ClientAliveInterval 300** and **ClientAliveCountMax 2**: Ensures that inactive sessions are terminated, improving session management and reducing risk from lingering sessions.
8. **UseDNS no**: Disables DNS lookups during authentication, preventing potential delays and attacks.
9. **PermitRootLogin no**: Completely disables root login, enforcing that root access must use non-root users and then escalate privileges if necessary.

These changes make the configuration more secure by tightening authentication methods, reducing the potential attack surface, and improving session management.

---
## 10. Configure Kerberos

### Why:
Kerberos is used for secure authentication. Configuring Kerberos ensures that users can authenticate to the AD using Kerberos tickets.

### How:
During installation, you might be prompted to configure the Kerberos realm. If you missed this step, you can configure it manually; either way:

1. Edit the Kerberos configuration file:

```bash
sudo nano /etc/krb5.conf
```

Example configuration:

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
### Explanation of `krb5.conf` File

The krb5.conf file, which is the primary configuration file for Kerberos 5 on a Unix-like system.

#### [logging]
```plaintext
[logging]
 default = FILE:/var/log/krb5libs.log
 kdc = FILE:/var/log/krb5kdc.log
 admin_server = FILE:/var/log/kadmind.log
```

- **default**: Specifies the default logging location for Kerberos libraries. Here, it logs to `/var/log/krb5libs.log`.
- **kdc**: Specifies the logging location for the Kerberos Key Distribution Center (KDC). Logs are directed to `/var/log/krb5kdc.log`.
- **admin_server**: Specifies the logging location for the Kerberos administration server. Logs are directed to `/var/log/kadmind.log`.

#### [libdefaults]
```plaintext
[libdefaults]
 default_realm = INT.SPACECITYCYBER.COM
 dns_lookup_realm = false
 dns_lookup_kdc = true
 ticket_lifetime = 24h
 renew_lifetime = 7d
 forwardable = true
```

- **default_realm**: Specifies the default Kerberos realm. This realm is used if no other realm is specified. Here, it is set to `INT.SPACECITYCYBER.COM`.
- **dns_lookup_realm**: If set to `true`, Kerberos uses DNS to determine the realm of a host. Here, it is set to `false`.
- **dns_lookup_kdc**: If set to `true`, Kerberos uses DNS to locate the KDC servers. Here, it is set to `true`.
- **ticket_lifetime**: Specifies the default lifetime for Kerberos tickets. Here, tickets are valid for 24 hours.
- **renew_lifetime**: Specifies the maximum lifetime for a renewable ticket. Here, tickets can be renewed for up to 7 days.
- **forwardable**: If set to `true`, tickets are forwardable by default. This means that the tickets can be forwarded to other machines.

#### [realms]
```plaintext
[realms]
 INT.SPACECITYCYBER.COM = {
  kdc = dc1.int.spacecitycyber.com
  admin_server = dc1.int.spacecitycyber.com
 }
```

- **INT.SPACECITYCYBER.COM**: This section defines the configuration for the `INT.SPACECITYCYBER.COM` realm.
  - **kdc**: Specifies the hostname of the Key Distribution Center (KDC) for this realm. Here, it is `dc1.int.spacecitycyber.com`.
  - **admin_server**: Specifies the hostname of the Kerberos administration server. Here, it is also `dc1.int.spacecitycyber.com`.

#### [domain_realm]
```plaintext
[domain_realm]
 .int.spacecitycyber.com = INT.SPACECITYCYBER.COM
 int.spacecitycyber.com = INT.SPACECITYCYBER.COM
```

- **.int.spacecitycyber.com**: Maps the domain `.int.spacecitycyber.com` to the `INT.SPACECITYCYBER.COM` realm. The leading dot indicates that any subdomain of `.int.spacecitycyber.com` is also mapped to this realm.
- **int.spacecitycyber.com**: Maps the specific domain `int.spacecitycyber.com` to the `INT.SPACECITYCYBER.COM` realm.

#### Summary

This `krb5.conf` file configures Kerberos 5 with specific settings and mappings:

1. **Logging Configuration**:
   - Logs Kerberos-related activities to specific files for libraries, KDC, and admin server.

2. **Library Defaults**:
   - Sets the default Kerberos realm.
   - Configures DNS lookups for realms and KDC.
   - Specifies ticket lifetimes and renewability.
   - Enables forwardable tickets by default.

3. **Realms**:
   - Defines the `INT.SPACECITYCYBER.COM` realm.
   - Specifies the KDC and admin server for this realm.

4. **Domain-to-Realm Mapping**:
   - Maps the domain and subdomains of `int.spacecitycyber.com` to the `INT.SPACECITYCYBER.COM` realm.

These settings ensure that Kerberos clients and services can properly authenticate and obtain tickets within the specified realm, using the configured KDC and admin server, with appropriate logging and ticket management policies. This configuration supports the integration with Active Directory and centralized authentication mechanisms, as indicated in your previous setups.

---
### Example of a Secure and Robust `krb5.conf` File

```plaintext
[logging]
 default = FILE:/var/log/krb5libs.log
 kdc = FILE:/var/log/krb5kdc.log
 admin_server = FILE:/var/log/kadmind.log

[libdefaults]
 default_realm = INT.SPACECITYCYBER.COM
 dns_lookup_realm = false
 dns_lookup_kdc = true
 ticket_lifetime = 10h
 renew_lifetime = 7d
 forwardable = true
 proxiable = true
 rdns = false
 udp_preference_limit = 1
 kdc_timeout = 5
 default_tgs_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96
 default_tkt_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96
 permitted_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96
 ignore_acceptor_hostname = true

[realms]
 INT.SPACECITYCYBER.COM = {
  kdc = dc1.int.spacecitycyber.com
  admin_server = dc1.int.spacecitycyber.com
  default_domain = int.spacecitycyber.com
  kpasswd_server = dc1.int.spacecitycyber.com
 }

[domain_realm]
 .int.spacecitycyber.com = INT.SPACECITYCYBER.COM
 int.spacecitycyber.com = INT.SPACECITYCYBER.COM

[capaths]
 INT.SPACECITYCYBER.COM = {
  . = INT.SPACECITYCYBER.COM
 }
```

### Explanation of Enhanced Settings

#### [logging]
```plaintext
[logging]
 default = FILE:/var/log/krb5libs.log
 kdc = FILE:/var/log/krb5kdc.log
 admin_server = FILE:/var/log/kadmind.log
```
- **default**: Logs Kerberos library actions.
- **kdc**: Logs KDC actions.
- **admin_server**: Logs admin server actions.

#### [libdefaults]
```plaintext
[libdefaults]
 default_realm = INT.SPACECITYCYBER.COM
 dns_lookup_realm = false
 dns_lookup_kdc = true
 ticket_lifetime = 10h
 renew_lifetime = 7d
 forwardable = true
 proxiable = true
 rdns = false
 udp_preference_limit = 1
 kdc_timeout = 5
 default_tgs_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96
 default_tkt_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96
 permitted_enctypes = aes256-cts-hmac-sha1-96 aes128-cts-hmac-sha1-96
 ignore_acceptor_hostname = true
```
- **default_realm**: Specifies the default Kerberos realm.
- **dns_lookup_realm**: Disables DNS lookups for realms for added security.
- **dns_lookup_kdc**: Enables DNS lookups for KDCs for flexibility.
- **ticket_lifetime**: Reduces the ticket lifetime to 10 hours for better security.
- **renew_lifetime**: Allows ticket renewal for up to 7 days.
- **forwardable**: Enables forwardable tickets.
- **proxiable**: Enables proxiable tickets.
- **rdns**: Disables reverse DNS lookups to prevent certain attacks.
- **udp_preference_limit**: Prefers UDP for KDC communication, can be adjusted based on network.
- **kdc_timeout**: Sets a timeout for KDC requests to 5 seconds.
- **default_tgs_enctypes** and **default_tkt_enctypes**: Specifies strong encryption types for tickets.
- **permitted_enctypes**: Specifies allowed encryption types, ensuring strong encryption.
- **ignore_acceptor_hostname**: Ignores hostname checking to prevent certain types of DNS-based attacks.

#### [realms]
```plaintext
[realms]
 INT.SPACECITYCYBER.COM = {
  kdc = dc1.int.spacecitycyber.com
  admin_server = dc1.int.spacecitycyber.com
  default_domain = int.spacecitycyber.com
  kpasswd_server = dc1.int.spacecitycyber.com
 }
```
- **INT.SPACECITYCYBER.COM**: Defines settings for the `INT.SPACECITYCYBER.COM` realm.
  - **kdc**: Specifies the KDC server.
  - **admin_server**: Specifies the admin server.
  - **default_domain**: Maps the default domain to the realm.
  - **kpasswd_server**: Specifies the server for password changes.

#### [domain_realm]
```plaintext
[domain_realm]
 .int.spacecitycyber.com = INT.SPACECITYCYBER.COM
 int.spacecitycyber.com = INT.SPACECITYCYBER.COM
```
- Maps domains to the Kerberos realm, ensuring that all subdomains are correctly mapped.

#### [capaths]
```plaintext
[capaths]
 INT.SPACECITYCYBER.COM = {
  . = INT.SPACECITYCYBER.COM
 }
```
- **capaths**: Defines the cross-realm authentication paths. In this simple configuration, it is straightforward, but in environments with multiple realms, this section can be crucial for defining trusted paths.

#### Summary

This enhanced `krb5.conf` file adds several security and robustness improvements, including:

1. **Shortened Ticket Lifetime**: Reduces the exposure window for potentially compromised tickets.
2. **Strong Encryption**: Enforces the use of strong encryption algorithms.
3. **Timeouts and Limits**: Configures timeouts and limits to improve resilience against network issues and attacks.
4. **DNS Security**: Disables reverse DNS lookups and restricts DNS-based realm lookups to prevent certain types of attacks.
5. **Comprehensive Logging**: Ensures all critical components log to specific files for better monitoring and auditing.

These settings ensure a secure Kerberos environment, aligning with the security practices suggested in SSH and SSSD secure configurations.

---
**2. Edit the KDC configuration file:**

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
### Explanation of `kdc.conf` File

#### [kdcdefaults]
```plaintext
[kdcdefaults]
    kdc_ports = 88
```
- **kdc_ports = 88**: Specifies the default port that the KDC listens on for requests. Port 88 is the standard port for Kerberos traffic. This ensures the KDC is reachable on the correct port for Kerberos operations.

#### [realms]
```plaintext
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
This section defines the configuration for the specific Kerberos realm `INT.SPACECITYCYBER.COM`.

1. **database_name = /var/lib/krb5kdc/principal**:
   - **database_name**: Specifies the location of the KDC database, which stores all principal information. Here, it is located at `/var/lib/krb5kdc/principal`.

2. **admin_keytab = /etc/krb5kdc/kadm5.keytab**:
   - **admin_keytab**: Specifies the location of the keytab file used by the KDC administrative server. This file contains keys that allow the KDC to securely authenticate administrative requests. It is located at `/etc/krb5kdc/kadm5.keytab`.

3. **acl_file = /etc/krb5kdc/kadm5.acl**:
   - **acl_file**: Specifies the location of the Access Control List (ACL) file that defines administrative permissions. This file is located at `/etc/krb5kdc/kadm5.acl`.

4. **key_stash_file = /etc/krb5kdc/stash**:
   - **key_stash_file**: Specifies the location of the stash file, which stores the master key for the KDC database in an encrypted format. This file allows the KDC to start without manually entering the master key. It is located at `/etc/krb5kdc/stash`.

5. **kdc_ports = 88**:
   - **kdc_ports**: Specifies the port number for the KDC to listen on for this realm. This reaffirms the default port specified earlier and ensures that the KDC listens on port 88.

6. **max_life = 10h 0m 0s**:
   - **max_life**: Specifies the maximum lifetime for Kerberos tickets issued by the KDC. Here, tickets have a maximum lifetime of 10 hours. This limits the validity of issued tickets to reduce the risk of prolonged unauthorized access if a ticket is compromised.

7. **max_renewable_life = 7d 0h 0m 0s**:
   - **max_renewable_life**: Specifies the maximum renewable lifetime for Kerberos tickets. Here, tickets can be renewed for up to 7 days. This allows users to extend the validity of their tickets without re-authenticating, while still limiting the overall duration for security reasons.

### Summary

The `kdc.conf` file configures essential aspects of the Kerberos Key Distribution Center for the realm `INT.SPACECITYCYBER.COM`, ensuring secure and efficient Kerberos ticket management. Key settings include:

1. **Port Configuration**:
   - The KDC listens on the standard Kerberos port (88), ensuring proper communication with clients and services.

2. **Database and Key Management**:
   - **database_name**: Location of the principal database.
   - **admin_keytab**: Keytab for administrative authentication.
   - **acl_file**: Access control list for administrative permissions.
   - **key_stash_file**: Stash file for securely storing the master key.

3. **Ticket Lifetime Settings**:
   - **max_life**: Limits the lifetime of issued tickets to 10 hours.
   - **max_renewable_life**: Allows tickets to be renewed for up to 7 days.

These configurations ensure that the KDC operates securely, with controlled access to the Kerberos database, secure key management, and reasonable ticket lifetimes to balance usability and security.

---

3. Create the Kerberos database:

```bash
sudo krb5_newrealm
```

---
### Start the Kerberos Services

### Why:
Starting the Kerberos services ensures that the Kerberos Key Distribution Center (KDC) and the admin server are running, allowing for authentication and ticket management.

### How:
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

### Testing the Kerberos Setup

### Why:
Testing ensures that the Kerberos setup is functioning correctly and that users can obtain and use Kerberos tickets for authentication.

### How:
1. Obtain a Kerberos ticket for the admin principal:

```bash
kinit admin
```

2. Verify the ticket:

```bash
klist
```

You should see the ticket listed.

## 11. Restart Services

### Why:
Restarting the services ensures that all changes made to the configuration files are applied.

### How:
Restart the necessary services to apply the changes:

```bash
sudo systemctl restart sssd
sudo systemctl restart sshd
sudo systemctl restart ssh
```

## Summary
