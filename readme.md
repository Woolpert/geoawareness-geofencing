# Geofencing service

The Geofencing service performs the following operations:

1. Listens for telemetry event messages in the geoawareness-ingest Pub/Sub topic
1. Intersects events against geofence polygons stored in Datastore
1. Writes the results to Order and Event documents in Datastore

## Getting Started

Configure gcloud shell environment.

```
export NEW_EVENT_STATUS=open # optional
export INGEST_SUBSCRIPTION_NAME=geoawareness-geofencing-service # optional
```

Create service account. Example - _geoawareness@geoawareness-sandbox.iam.gserviceaccount.com_.

The service account must have the following minimum permissions:

- Firestore Datastore User
- Pub/Sub Subscriber
- Pub/Sub Publisher (demo script only)


```
gcloud iam service-accounts create geoawareness
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:geoawareness@$PROJECT_ID.iam.gserviceaccount.com --role=roles/editor
```

Create key for service account and download credentials json file. This step is required if running the tests or demo locally.

```
export GOOGLE_APPLICATION_CREDENTIALS=geoawareness-service-account-credentials.json
gcloud iam service-accounts keys create $GOOGLE_APPLICATION_CREDENTIALS \
   --iam-account geoawareness@$PROJECT_ID.iam.gserviceaccount.com
```

### Datastore

Create a new [Datastore database](https://cloud.google.com/datastore/docs/quickstart#create_a_database) in the GCP project you created earlier. If creating
from the console, then select 'Datastore mode'.

```bash
gcloud app create
gcloud alpha datastore databases create --region $GCP_REGION
```

Build Datastore indexes.

```
gcloud datastore indexes create index.yaml
```

### Pub/Sub

Create Pub/Sub topic and subscription.

```
gcloud services enable pubsub.googleapis.com
gcloud pubsub topics create geoawareness-ingest
gcloud pubsub subscriptions create geoawareness-geofencing-service --topic geoawareness-ingest
```

## Run tests

```
npm install
npm test
```

## Run demo

Seed Firestore (DataStore mode) database.

```bash
# Seed Firestore (DataStore mode) database.
node demo/seed_repository.js

# Launch the Pub/Sub listener in the background.
node listener.js &

# Send mock telemetry events for the Dalton Drive route.
node demo/drive-route.js
```

You will see JSON payload telemetry for three test users, who eventually reach their
destinations and the program ends.

For existing infrastructure, you only need to run `node demo/drive-route.js`.

## Deploy to GCP

```bash
# This only needs to be run the first time
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

gcloud builds submit --tag gcr.io/$PROJECT_ID/geoawareness-geofencing-service

gcloud compute instances create-with-container geoawareness-geofencing-service  \
--container-image=gcr.io/$PROJECT_ID/geoawareness-geofencing-service \
--service-account=geoawareness@$PROJECT_ID.iam.gserviceaccount.com \
--scopes=default,pubsub,datastore \
--machine-type=e2-micro \
--zone=$GCP_ZONE
```

The listener is ready to handle messages from the ingest topic as a pull subscriber.

### Smoke test

```
gcloud pubsub topics publish geoawareness-ingest --message="$(jq '.[0]' < ./test/fakes/events.json)"
```

Check the logs of VM Instance `geoawareness-geofencing-service` for evidence that a
message was received for processing.

### Updating deployed container

```
gcloud builds submit --tag gcr.io/$PROJECT_ID/geoawareness-geofencing-service
gcloud compute instances update-container geoawareness-geofencing-service --container-image gcr.io/$PROJECT_ID/geoawareness-geofencing-service
```
