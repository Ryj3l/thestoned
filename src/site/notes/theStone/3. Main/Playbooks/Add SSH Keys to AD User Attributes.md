---
{"dg-publish":true,"permalink":"/the-stone/3-main/playbooks/add-ssh-keys-to-ad-user-attributes/"}
---



# [[theStone/3. Main/Playbooks/Add SSH Keys to AD User Attributes\|Add SSH Keys to AD User Attributes]]

## 📝 Notes

The best way to have users generate SSH keys for AD in this model is to provide a clear, step-by-step guide for them. This guide should include instructions on how to generate SSH keys, how to format them for Active Directory, and how to securely submit them for inclusion in AD.

### Guide for Users: Generating and Submitting SSH Keys for Active Directory

#### Step 1: Generate SSH Key Pair

1. **Open a Terminal**:
   - On Linux or macOS, open your terminal.
   - On Windows, you can use Git Bash, PowerShell, or any terminal emulator that supports SSH.

2. **Generate the Key Pair**:
   - Run the following command to generate a new SSH key pair:
```bash
ssh-keygen -t rsa -b 4096 -C "ryjel"
```
   - Follow the prompts to save the key pair. By default, it will save to `~/.ssh/id_rsa`. You can press Enter to accept the default location.
   - When prompted, enter a secure passphrase for the SSH key (optional but recommended).

3. **Locate the Public Key**:
   - The public key will be saved in the file `~/.ssh/id_rsa.pub`.

#### Step 2: Format the SSH Public Key for Active Directory

1. **Open the Public Key File**:
   - Open the `~/.ssh/id_rsa.pub` file in a text editor.
   - The content of this file should look something like this:
     ```
     ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArb5qT7s... user@hostname
     ```

2. **Format the Key**:
   - Add the prefix `X509:/CN=` before the key type (`ssh-rsa`). The formatted key should look like this:
     ```
     X509:/CN=ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArb5qT7s... user@hostname
     ```

#### Step 3: Submit the SSH Public Key for AD Inclusion

1. **Secure Submission**:
   - Depending on your organization's policy, submit the formatted SSH public key to your IT department or the AD administrator.
   - The submission could be done via:
     - A secure web form.
     - An encrypted email.
     - A secure file transfer method (like SFTP or a shared drive with restricted access).

2. **Example Email Template**:
   ```text
   Subject: SSH Public Key for AD Integration

   Dear IT Team,

   Please find below my SSH public key for inclusion in Active Directory:

   Username: your_username
   SSH Public Key:
   X509:/CN=ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArb5qT7s... user@hostname

   Thank you,
   Your Name
   ```

### Step-by-Step Instructions for IT/Admins to Add SSH Keys to AD

1. **Receive the SSH Key**:
   - Ensure the received SSH key is in the correct format.

2. **Use AD Users and Computers (GUI) to Add the Key**:
   - Open Active Directory Users and Computers.
   - Locate the user account.
   - Open the properties of the user account.
   - Go to the `Attribute Editor` tab.
   - Find the `altSecurityIdentities` attribute.
   - Add the SSH key to this attribute.

3. **Automate the Process with PowerShell**:
   - Save the formatted SSH key and username from the email to a file or directly use the values.
   - Run the following PowerShell script to add the key:

   ```powershell
   # Define the user and the SSH key
   $username = "your_username"
   $sshKey = "X509:/CN=ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArb5qT7s... user@hostname"

   # Find the user in AD
   $adUser = Get-ADUser -Filter {sAMAccountName -eq $username} -Properties altSecurityIdentities

   if ($adUser) {
       # Add the SSH key to the altSecurityIdentities attribute
       Set-ADUser -Identity $adUser -Add @{altSecurityIdentities=$sshKey}
       Write-Host "Successfully added SSH key for user: $username"
   } else {
       Write-Host "User not found: $username"
   }
   ```

### Verification and Testing
If `/usr/bin/sss_ssh_authorizedkeys username` returns nothing, it indicates that SSSD is not able to retrieve the SSH keys from Active Directory. Here are some steps to diagnose and resolve this issue:

### 1. **Verify SSH Key in AD**
Ensure that the SSH public key is correctly added to the `altSecurityIdentities` attribute of the AD user object.

1. **Open AD Users and Computers (ADUC)**
2. **Locate the User**
3. **Open Properties of the User Account**
4. **Go to the `Attribute Editor` Tab**
5. **Verify the `altSecurityIdentities` Attribute**:
   - Ensure it contains the SSH key in the correct format, for example:
     ```
     X509:/CN=ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArb5qT7s... user@hostname
     ```

### 2. **Check SSSD Configuration**
Ensure that SSSD is properly configured to use the AD domain and fetch user attributes.

### 3. **Check Logs for Errors**
Check the SSSD logs for errors that might explain why the SSH keys are not being fetched:

```sh
sudo tail -f /var/log/sssd/sssd_*.log
```

Look for any errors or warnings related to fetching SSH keys or communication with the AD server.

### 4. **Enable Debug Logging in SSSD**
Increase the debug level for SSSD to get more detailed logs:

Edit `/etc/sssd/sssd.conf` and add `debug_level = 9` under the `[domain/int.spacecitycyber.com]` section:

```ini
[domain/int.spacecitycyber.com]
...
debug_level = 9
```

Restart SSSD:

```sh
sudo systemctl restart sssd
```

Try to fetch the SSH keys again and check the logs for detailed information.

### 5. **Verify User Object in AD**
Ensure the user object in AD has the `altSecurityIdentities` attribute populated with the correct SSH key.

### 6. **Check LDAP Search Base**
Ensure that the LDAP search base is correctly configured in your SSSD configuration. Sometimes the search base needs to be specified explicitly.

### 7. **Ensure SSSD is Joined to the Domain**
Ensure that the SSSD service is properly joined to the AD domain:

```sh
sudo realm list
```

This should show your domain `int.spacecitycyber.com` with relevant details.

### 8. **Manual LDAP Query**
Perform a manual LDAP query to check if the `altSecurityIdentities` attribute is being returned:

Install `ldap-utils`:

```sh
sudo apt-get install ldap-utils
```

Perform the LDAP search (replace placeholders with your actual values):

```sh
ldapsearch -H ldap://your-ad-server -b "dc=int,dc=spacecitycyber,dc=com" -D "CN=your-bind-user,CN=Users,DC=int,DC=spacecitycyber,DC=com" -W -s sub "(sAMAccountName=username)" altSecurityIdentities
```

Enter the bind password when prompted. This should return the `altSecurityIdentities` attribute for the user.

### 9. **Check SSSD Configuration for LDAP**
Ensure the LDAP settings in `sssd.conf` are correctly pointing to your AD server and using the correct credentials:

```ini
[domain/int.spacecitycyber.com]
ldap_uri = ldap://your-ad-server
ldap_search_base = dc=int,dc=spacecitycyber,dc=com
ldap_id_use_start_tls = True
ldap_tls_cacertdir = /etc/openldap/cacerts
ldap_tls_reqcert = allow
ldap_default_bind_dn = cn=your-bind-user,cn=Users,dc=int,dc=spacecitycyber,dc=com
ldap_default_authtok_type = password
ldap_default_authtok = your-bind-password
```

### Example Adjusted `sssd.conf`:

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
ldap_uri = ldap://your-ad-server
ldap_search_base = dc=int,dc=spacecitycyber,dc=com
ldap_id_use_start_tls = True
ldap_tls_cacertdir = /etc/openldap/cacerts
ldap_tls_reqcert = allow
ldap_default_bind_dn = cn=your-bind-user,cn=Users,dc=int,dc=spacecitycyber,dc=com
ldap_default_authtok_type = password
ldap_default_authtok = your-bind-password

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

After making these adjustments, restart SSSD:

```sh
sudo systemctl restart sssd
```

### Test Again
1. **Check SSH Key Retrieval:**
   ```sh
   /usr/bin/sss_ssh_authorizedkeys username
   ```

2. **Test SSH Login:**
   ```sh
   ssh -vvv username@hostname
   ```

By following these steps, you should be able to diagnose and resolve the issue with fetching SSH keys from Active Directory.