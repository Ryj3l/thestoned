---
{"dg-publish":true,"permalink":"/the-stone/3-main/nginx-and-no-ip-for-dns/"}
---



# [[theStone/3. Main/Nginx and No-IP for DNS\|Nginx and No-IP for DNS]]

## 📝 Notes

To set up this configuration with your domain `no-ip.zapto.org` (using No-IP for DNS forwarding) but hosting Nginx on your internal server (`nginx.yourdomain.com`) and forwarding traffic through your firewall, you can follow these steps:

### 1. **Set Up No-IP for DNS Forwarding**

- **No-IP Setup**: Ensure that you’ve correctly configured `no-ip.zapto.org` on No-IP to point to the public IP address of your firewall.
- **Firewall Port Forwarding**: Configure your firewall to forward incoming traffic on ports 80 (HTTP) and 443 (HTTPS) to the internal server (`nginx.yourdomain.com`). 
  - Port 80 should forward to the Nginx server’s port 80.
  - Port 443 should forward to the Nginx server’s port 443.

### 2. **Update the Nginx Configuration**

You'll need to modify the Nginx configuration to reflect your actual domain (`heucomondo.hopto.org`) and SSL setup. Here's how you can modify the configuration:

```nginx
server {
    listen 80;
    server_name no-ip.zapto.org www.no-ip.zapto.org;

    location / {
        proxy_pass http://nginx.yourdomain.com:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name no-ip.zapto.org www.no-ip.zapto.org;

    ssl_certificate /etc/letsencrypt/live/no-ip.zapto.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/no-ip.zapto.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://nginx.yourdomain.com:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Changes in the Nginx Configuration:
- **server_name**: Replace `yourdomain.com` with your external No-IP domain (`no-ip.zapto.org`).
- **proxy_pass**: Update this to point to your internal server, `nginx.yourdomain.com`, which is likely hosting the application on port 8080.
  - If your application is running on a different port, modify this accordingly.
- **SSL Configuration**: You need SSL certificates for `no-ip.zapto.org`. You can use Let's Encrypt to generate SSL certificates for this domain.

### 3. **Obtain SSL Certificates with Let's Encrypt**

Since you're using Nginx, you can use Let's Encrypt’s `certbot` to obtain and manage SSL certificates for `no-ip.zapto.org`.

Here’s a basic process:
1. **Install certbot**: If you haven’t already installed it, you can install `certbot` using the following command:
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    ```
2. **Obtain SSL Certificate**:
    ```bash
    sudo certbot --nginx -d no-ip.zapto.org -d www.no-ip.zapto.org
    ```
    This command will automatically configure your Nginx server block to use SSL. It will generate the certificates and store them at `/etc/letsencrypt/live/no-ip.zapto.org/`.

3. **Set Up Automatic Renewal**:
    Certbot automatically configures a cron job to renew your certificates. You can verify the renewal process using:
    ```bash
    sudo certbot renew --dry-run
    ```

### 4. **Firewall Configuration**

You need to ensure that your firewall is forwarding traffic properly:
- **HTTP Traffic (Port 80)**: Forward traffic from `no-ip.zapto.org` to the Nginx server's IP address on port 80.
- **HTTPS Traffic (Port 443)**: Forward traffic from `no-ip.zapto.org` to the Nginx server's IP address on port 443.

### 5. **DNS Resolution for Internal Server**

Since your internal server is named `nginx.yourdomain.com`, ensure that this domain resolves correctly in your internal network. If you're using a private DNS server, ensure that it points to the correct internal IP for `nginx.yourdomain.com`.

### 6. **Testing the Setup**

- After configuring everything, you can test by accessing `http://no-ip.zapto.org` to ensure that the traffic is being forwarded correctly and redirects to `https://no-ip.zapto.org`.
- Verify that SSL is working by inspecting the security certificate in your browser when accessing the HTTPS version.

By following these steps, you will have a functioning setup where traffic to `heucomondo.hopto.org` is forwarded through your firewall, handled by Nginx on your internal server, and proxied to the app running on `Obsidian.yourdomain.com`.

## Related Ideas [[]] 
- 



