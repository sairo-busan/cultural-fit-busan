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

/**
 * 실제 연결은 호출 시점(런타임)에만 시도한다 — 빌드 시 env 미설정으로 죽지 않도록.
 * dev(HMR 재연결 방지)뿐 아니라 production(Vercel 서버리스 warm 컨테이너 재사용,
 * Atlas M0 동시 연결 제한 500개 고려)에서도 global 캐싱한다.
 */
function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connect();
  }
  return global._mongoClientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db("cultural_fit_busan");
}
