import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI가 설정되지 않았습니다");
  }
  return new MongoClient(uri).connect();
}

/** 실제 연결은 호출 시점(런타임)에만 시도한다 — 빌드 시 env 미설정으로 죽지 않도록 */
function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    // dev 모드 HMR 시 커넥션이 계속 새로 생기는 것을 막기 위해 global에 캐싱
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = connect();
    }
    return global._mongoClientPromise;
  }
  return connect();
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db("cultural_fit_busan");
}
