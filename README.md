
# Automatically remove users in community project

This project can import JSON file (list of users in communities), automatically removing each user in the community.


## 💻 Tech Stack

**Server:** Node, Typescript


## 🌍 Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`ASC_URL`

`ADMIN_TOKEN`

`COMMUNITY_ID`

`FILE_NAME`

## 🚀 Run Locally

Clone the project

```bash
  git clone https://github.com/jamespaisan/remove-user-in-community.git
```

Go to the project directory

```bash
  cd remove-user-in-community
```

Install dependencies

```bash
  npm install
```

Create .env file

```bash
  - copy .env.example .env  -> Windows
  - cp .env.example .env    -> Linux/Mac
```

Start the server

```bash
  npm run dev
```
## 🏢 Build

Build project for production.

```bash
  npm run build
```

Start project.

```bash
  npm run start
```
    
## 🟢 How to use

You can create a JSON file for the user list and paste it into the folder path:

       src/files/rm-user-list-from-community

After the csv file is created, you can run this command:

       npm run dev

When the project is running, Will be read and file will be processed gently.

#### Example JSON file
The JSON file should contain the following data:

* `_id` -- Internal id as text
* `publicId` -- User ID as text


        [
            {
                "_id": "99993333tt3444",
                "publicId": "admin01"
            },
            {
                "_id": "99993333tt3222",
                "publicId": "admin02"
            }
        ]
## 🚨 FYI

After processing the file, if there are any errors it will create a json file to this path:

        src/logs/failed-batches