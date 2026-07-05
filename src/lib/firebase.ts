import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// AI Studio 프리뷰 환경 등 WebSocket 연결이 제한적인 환경에서 
// Firestore 연결 오류([code=unavailable])가 발생하지 않도록 강제로 Long Polling을 사용합니다.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
