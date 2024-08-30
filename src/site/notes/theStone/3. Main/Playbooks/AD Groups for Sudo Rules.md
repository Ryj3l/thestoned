---
{"dg-publish":true,"permalink":"/the-stone/3-main/playbooks/ad-groups-for-sudo-rules/"}
---

# [[Group Policy for Sudo Rules\|Group Policy for Sudo Rules]]

## 📝 Notes

### Modifying Sudo Rules in Active Directory Using `ldifde`

In this model, sudo rules are managed centrally in Active Directory (AD). To modify sudo rules, you need to update the LDAP entries in AD. This involves using tools like `ldifde` to make changes to the sudoers entries stored in AD.

### Steps to Modify Sudo Rules

#### 1. Prepare the LDIF File

Create an LDIF file that contains the modifications you want to make. For example, if you want to add a new sudo rule for a group `hiroSU` to allow members to run `/usr/bin/systemctl` without a password, your LDIF file might look like this:

```ldif
dn: cn=hiroSU,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: modify
add: sudoCommand
sudoCommand: /usr/bin/systemctl
-
add: sudoOption
sudoOption: !authenticate
```

Save this content in a file named `modify_sudoers.ldif`.

#### 2. Apply the LDIF File

Use `ldifde` to apply the changes. Replace `ad-server.int.spacecitycyber.com` with your AD server's address.

```cmd
ldifde -i -f modify_sudoers.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com Password
```

### Example: Adding a New Sudo Rule

Suppose you want to add a new rule that allows the `hiroSU` group to run `sudo` without a password. Here’s how you can do it:

#### 1. Prepare the LDIF File

Create a file named `add_sudo_rule.ldif` with the following content:

```ldif
dn: cn=hiroSU,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: add
objectClass: top
objectClass: sudoRole
cn: hiroSU
sudoUser: %hiroSU
sudoHost: ALL
sudoCommand: ALL
sudoOption: !authenticate
```

#### 2. Apply the LDIF File

Use `ldifde` to add the new rule:

```cmd
ldifde -i -f add_sudo_rule.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com Password
```

### Example: Removing a Sudo Rule

To remove a sudo rule, you would create an LDIF file that specifies the delete operation. For example, to remove the rule allowing `hiroSU` group to run `/bin/su hiro_SVC`, create a file named `delete_sudo_rule.ldif`:

```ldif
dn: cn=hiroSU,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: modify
delete: sudoCommand
sudoCommand: /bin/su hiro_SVC
```

Then apply the changes with `ldifde`:

```cmd
ldifde -i -f delete_sudo_rule.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com Password
```

### Viewing Current Sudo Rules

You can view the current sudo rules using `ldifde` for export. For example, to view all sudo rules:

```cmd
ldifde -f export_sudo_rules.ldif -s ad-server.int.spacecitycyber.com -d "ou=SUDOers,dc=int,dc=spacecitycyber,dc=com" -r "(objectClass=sudoRole)" -b admin@int.spacecitycyber.com Password
```

### Summary

To modify sudo rules in this model, you:

1. **Prepare an LDIF file** with the desired changes (add, modify, delete).
2. **Apply the LDIF file** using `ldifde` commands.
3. **View current sudo rules** using `ldifde` if needed.

This centralized approach allows you to manage sudo rules efficiently across your network from a single point of administration in Active Directory.
## Managing hosts 

Hosts that need different sudoers groups can be accomplished by creating specific sudo roles for each group of hosts and users in Active Directory (AD). You can leverage the LDAP structure to manage different sudoers rules efficiently.

Here’s a step-by-step guide on how to set up and manage different sudoers groups for different hosts:

### Step-by-Step Guide

#### 1. Extend the AD Schema and Create Organizational Units

If not already done, extend the AD schema and create an organizational unit (OU) for sudoers as described in previous sections.

#### 2. Create Sudoers LDAP Entries

Create specific sudo roles in LDAP for each group of hosts and users.

To use `ldifde` for importing the LDIF files on the command line, you need to convert the `ldapadd` commands to `ldifde` commands.

### Step-by-Step Guide

#### Step 2.1: Prepare the LDIF Files for Different Groups

**Example: Group A - Admin Access**
```ldif
dn: cn=groupA-admins,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: add
objectClass: top
objectClass: sudoRole
cn: groupA-admins
sudoUser: %groupA-admins
sudoHost: hostA1.int.spacecitycyber.com,hostA2.int.spacecitycyber.com
sudoCommand: ALL
sudoOption: !authenticate
```

**Example: Group B - Limited Access**
```ldif
dn: cn=groupB-limited,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: add
objectClass: top
objectClass: sudoRole
cn: groupB-limited
sudoUser: %groupB-limited
sudoHost: hostB1.int.spacecitycyber.com,hostB2.int.spacecitycyber.com
sudoCommand: /usr/bin/systemctl
sudoOption: !authenticate
```

**Example: Group C - Specific Command Access**
```ldif
dn: cn=groupC-specific,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: add
objectClass: top
objectClass: sudoRole
cn: groupC-specific
sudoUser: %groupC-specific
sudoHost: hostC1.int.spacecitycyber.com,hostC2.int.spacecitycyber.com
sudoCommand: /bin/ls,/bin/cat
sudoOption: !authenticate
```

#### Step 2.2: Apply the LDIF Files

1. **Save the LDIF files**: Save each of the above entries to individual `.ldif` files, such as `groupA-admins.ldif`, `groupB-limited.ldif`, and `groupC-specific.ldif`.

2. **Use `ldifde` to Import the LDIF Files**:

   Open Command Prompt as Administrator and run the following commands:

```cmd
ldifde -i -f groupA-admins.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
ldifde -i -f groupB-limited.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
ldifde -i -f groupC-specific.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
```

Replace `admin@int.spacecitycyber.com` with the appropriate admin user

### Full Example

For completeness, here are the full example LDIF files and the commands to run:

**groupA-admins.ldif**
```ldif
dn: cn=groupA-admins,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: add
objectClass: top
objectClass: sudoRole
cn: groupA-admins
sudoUser: %groupA-admins
sudoHost: hostA1.int.spacecitycyber.com,hostA2.int.spacecitycyber.com
sudoCommand: ALL
sudoOption: !authenticate
```

Command to run:
```cmd
ldifde -i -f groupA-admins.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
```

**groupB-limited.ldif**
```ldif
dn: cn=groupB-limited,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: add
objectClass: top
objectClass: sudoRole
cn: groupB-limited
sudoUser: %groupB-limited
sudoHost: hostB1.int.spacecitycyber.com,hostB2.int.spacecitycyber.com
sudoCommand: /usr/bin/systemctl
sudoOption: !authenticate
```

Command to run:
```cmd
ldifde -i -f groupB-limited.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
```

**groupC-specific.ldif**
```ldif
dn: cn=groupC-specific,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
changetype: add
objectClass: top
objectClass: sudoRole
cn: groupC-specific
sudoUser: %groupC-specific
sudoHost: hostC1.int.spacecitycyber.com,hostC2.int.spacecitycyber.com
sudoCommand: /bin/ls,/bin/cat
sudoOption: !authenticate
```

Command to run:
```cmd
ldifde -i -f groupC-specific.ldif -s ad-server.int.spacecitycyber.com -b admin@int.spacecitycyber.com
```

### Explanation

- **`ldifde -i`**: Specifies the import mode.
- **`-f`**: Specifies the filename of the LDIF file.
- **`-s`**: Specifies the LDAP server to connect to.
- **`-b`**: Specifies the binding credentials (username and password).

This will import the group-specific sudo rules into your Active Directory environment using `ldifde`.
#### 4. Configure SSSD on Hosts

Ensure each host is configured to use SSSD and to retrieve sudo rules from the LDAP server.

**Example SSSD Configuration on Host A (hostA1.int.spacecitycyber.com, hostA2.int.spacecitycyber.com)**
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
ldap_force_upper_case_realm = true
enumerate = True
fallback_homedir = /home/%u@%d
default_shell = /bin/bash

[pam]
offline_credentials_expiration = 2

[sudo]
sudo_provider = ldap
ldap_sudo_search_base = ou=SUDOers,dc=int,dc=spacecitycyber,dc=com

[ssh]
ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys
ssh_authorizedkeys_command_user = nobody
```

**Example SSSD Configuration on Host B (hostB1.int.spacecitycyber.com, hostB2.int.spacecitycyber.com)**
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
ldap_force_upper_case_realm = true
enumerate = True
fallback_homedir = /home/%u@%d
default_shell = /bin/bash

[pam]
offline_credentials_expiration = 2

[sudo]
sudo_provider = ldap
ldap_sudo_search_base = ou=SUDOers,dc=int,dc=spacecitycyber,dc=com

[ssh]
ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys
ssh_authorizedkeys_command_user = nobody
```

#### 5. Restart Services

Restart SSSD and SSH services to apply the changes:

```bash
sudo systemctl restart sssd
sudo systemctl restart sshd
```

### Summary

By creating specific sudo roles for different groups of hosts and users, you can manage different sudoer groups efficiently. Users are assigned to AD groups, and hosts are configured to fetch sudo rules from the LDAP server using SSSD. This setup ensures that users have appropriate sudo privileges based on the host they are accessing.


Adding a user to the sudoers group from Active Directory involves several steps. First, you need to create the appropriate sudoers LDAP entries in AD. Then, you assign users to AD groups that map to these sudoers entries. Finally, you configure the Linux clients to fetch and apply these sudo rules.

### Step-by-Step Guide Create Broad Groups

#### Step 1: Create Sudoers LDAP Entries in AD

##### Prepare LDIF Files for Sudoers Entries

**Example: Admin Group**
```ldif
dn: cn=adminGroup,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
objectClass: top
objectClass: sudoRole
cn: adminGroup
sudoUser: %adminGroup
sudoHost: ALL
sudoCommand: ALL
sudoOption: !authenticate
```

**Example: Limited Group**
```ldif
dn: cn=limitedGroup,ou=SUDOers,dc=int,dc=spacecitycyber,dc=com
objectClass: top
objectClass: sudoRole
cn: limitedGroup
sudoUser: %limitedGroup
sudoHost: ALL
sudoCommand: /usr/bin/systemctl
sudoOption: !authenticate
```

##### Apply the LDIF Files

1. **Save the LDIF files**: Save the above entries to individual `.ldif` files, such as `adminGroup.ldif` and `limitedGroup.ldif`.

2. **Use `ldifde` to Import the LDIF Files**:
   ```bash
  ldifde -i -f adminGroup.ldif -c "CN=Schema,CN=Configuration,DC=X" "DC=int,DC=spacecitycyber,DC=com"
   ldifde -i -f limitedGroup.ldif -c "CN=Schema,CN=Configuration,DC=X" "DC=int,DC=spacecitycyber,DC=com"
   ```

#### Step 2: Create and Assign Users to AD Groups

1. **Create AD Groups**: Create the groups `adminGroup` and `limitedGroup` in Active Directory.

2. **Assign Users to Groups**: Add users to these groups using the Active Directory Users and Computers GUI or via PowerShell.

**Example: Using PowerShell**
```powershell
# Add users to adminGroup
Add-ADGroupMember -Identity "adminGroup" -Members "Ryjel"

# Add users to limitedGroup
Add-ADGroupMember -Identity "limitedGroup" -Members "OtherUser"
```

#### Step 3: Configure SSSD on Linux Clients

Ensure each Linux client is configured to use SSSD and to retrieve sudo rules from the LDAP server.

**Example SSSD Configuration**
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
ldap_force_upper_case_realm = true
enumerate = True
fallback_homedir = /home/%u@%d
default_shell = /bin/bash

[pam]
offline_credentials_expiration = 2

[sudo]
sudo_provider = ldap
ldap_sudo_search_base = ou=SUDOers,dc=int,dc=spacecitycyber,dc=com

[ssh]
ssh_authorizedkeys_command = /usr/bin/sss_ssh_authorizedkeys
ssh_authorizedkeys_command_user = nobody
```

Set appropriate permissions:

```bash
sudo chmod 600 /etc/sssd/sssd.conf
```

#### Step 4: Restart Services

Restart SSSD and SSH services to apply the changes:

```bash
sudo systemctl restart sssd
sudo systemctl restart sshd
```

### Summary

1. **Create Sudoers LDAP Entries**: Define sudo roles in AD using LDIF files and import them with `ldapadd`.
2. **Create and Assign AD Groups**: Create AD groups corresponding to the sudo roles and assign users to these groups.
3. **Configure Linux Clients**: Ensure Linux clients are configured to use SSSD to fetch and apply sudo rules from AD.

By following these steps, you can manage sudo privileges centrally using Active Directory, ensuring that users have the appropriate sudo permissions based on their group membership.
## Related Ideas [[]] 
- 



