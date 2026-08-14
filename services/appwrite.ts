import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject("6a7e81b30035b5cc7d2d");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
