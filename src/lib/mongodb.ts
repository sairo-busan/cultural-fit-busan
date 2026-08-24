import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI가 설정되지 않았습니다");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // dev 모드 HMR 시 커넥션이 계속 새로 생기는 것을 막기 위해 global에 캐싱
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db("cultural_fit_busan");
}
