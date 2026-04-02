# opendidatu

Tries to be a simple alternative to Didatu, with a focus on eas of use. The main goal is to have something for trainig pourposes until a new full featured application is in place.

## Installation

The whole application is meant to run on a docker container, so you need to have docker installed on your machine. Then you can run the following command to build and start the application:

```bash
docker compose up --build
```

This will start a database container and the application container.

The application will be available at `localhost:8000`. You can access the panel at `localhost:8000`
If you want to access the applciation from another machine, you need to change the `localhost` to the IP address of the machine where the application is running.

If you want the applciation to be available on the local network under `opendidatu.local`, you need to add the following line to your `/etc/hosts` file:

```
127.0.0.1 opendidatu.local
```

Then you can access the application at `http://opendidatu.local:8000`.
