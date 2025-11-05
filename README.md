# SecurityOnlineTracking

Before using the project be sure you have `credentials.json` from **Google Cloud Console** and make sure **Google Sheets API** is enabled for your project.

Then run `npm i` to install requirements and after you sure everything is good run the server with `node server.js`

The server will be running on port 3000 by default. You can change the port by modifying the `port` variable in `server.js`.


# Documentation
The API has the following endpoints:
- `POST /login` - Logs in a user. Requires `username` and `password` in the request body.
- `GET /logout` - Logs out the current user. Requires a valid session cookie.
- `POST /data` - Gets data from Google Sheet. Requires a valid session cookie and request body.


## `POST /login`
- Request body example:
  ```json
  {
      "username": "your_username",
      "password": "your_password"
  }
  ```
  
- Response example:
  - **Success** with **http status code 200**
    ```json
    {
        "success": true,
        "message": "Xoş gəlmişsiniz!"
    }
    ```
  - **Failure** with **http status code 401**
    ```json
    {
        "success": false,
        "message": "Şifə səhvdir yenidən yoxlayın :("
    }
    ```
  - **Failure** with **http status code 400**
    ```json
    {
        "success": false,
        "message": "İstifadəçi adı və ya şifrə boş ola bilməz."
    }
    ```
  - **Failure** with **http status code 200**
    ```json
    {
        "success": false,
        "message": "Hal hazırda giriş etmiş vəziyyətdəsiniz."
    }

## `GET /logout`
- Response example:
  - **Success** with **http status code 200**
    ```json
    {
        "success": true,
        "message": "Uğurla çıxış etdiniz."
    }
    ```
  - **Failure** with **http status code 401**
    ```json
    {
        "success": false,
        "message": "Giriş etmədən bu əməliyyatı yerinə yetirə bilməzsiniz."
    }
    ```

## `POST /data`
- Request body example:
    ```json
    {
        "ad": "",
        "soyad": "",
        "status": "",
        "date": "",
        "fin": ""
    }
    ```

- Response example:
    - **Success** with **http status code 200**
        ```json
        [
            {
                "NAME": "Abutalıb Şiriyev",
                "FIN": "123AS123",
                "DATE": "11/5/2025 0:00:00",
                "STATUS": "Telebe"
            }
        ]
        ```

    - if there is no data it will return empty array
    ```json
    []
    ```