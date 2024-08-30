---
{"dg-publish":true,"permalink":"/the-stone/3-main/playbooks/setting-up-kerberos-in-linux/"}
---



# [[theStone/3. Main/Playbooks/Setting up Kerberos in Linux\|Setting up Kerberos in Linux]]

## 📝 Notes
Setting up Kerberos on Debian Linux involves several steps, including installing the necessary packages, configuring the Kerberos server (KDC), and setting up the Kerberos client. Here's a step-by-step guide:

### Step 1: Install the Kerberos Packages

1. Update your package list:

   ```bash
   sudo apt-get update
   ```

2. Install the Kerberos server and client packages:

   ```bash
   sudo apt-get install krb5-kdc krb5-admin-server krb5-config
   ```

### Step 2: Configure the Kerberos Server

1. During the installation, you'll be prompted to configure the Kerberos realm. If you miss this step, you can configure it manually by editing the Kerberos configuration file.

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

### Step 3: Configure the Admin Server

1. Edit the admin server configuration file:

   ```bash
   sudo nano /etc/krb5kdc/kadm5.acl
   ```

   Example configuration:

   ```plaintext
   */admin@EXAMPLE.COM *
   ```

2. Create an admin principal:

   ```bash
   sudo kadmin.local -q "addprinc admin/admin"
   ```

   You'll be prompted to set a password for the admin principal.

### Step 4: Start the Kerberos Services

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

### Step 5: Configure the Kerberos Client

1. Install the Kerberos client package on the client machine:

   ```bash
   sudo apt-get install krb5-user
   ```

2. Configure the client by editing the `/etc/krb5.conf` file, ensuring it matches the server's configuration.

### Step 6: Testing the Kerberos Setup

1. Obtain a Kerberos ticket for the admin principal:

   ```bash
   kinit admin/admin
   ```

2. Verify the ticket:

   ```bash
   klist
   ```

   You should see the ticket listed.

3. Optionally, you can add more principals and test their authentication.

### Additional Security Measures

1. Secure the Kerberos configuration and keytab files.
2. Regularly update and patch your Kerberos server and clients.
3. Monitor Kerberos logs for any suspicious activity.

By following these steps, you should have a functional Kerberos setup on your Debian Linux system.

## Related Ideas [[]] 
- 



