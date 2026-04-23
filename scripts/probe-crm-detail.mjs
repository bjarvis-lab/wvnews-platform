// Pull concrete samples so we know exactly what we're integrating with.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'wvnews-crm' });
const db = getFirestore();

async function main() {
  // 1. The canonical publications list
  console.log('═══ publications/config ═══');
  const pubs = await db.doc('publications/config').get();
  const list = pubs.data()?.list || [];
  console.log(`${list.length} publications:\n`);
  for (const p of list) console.log(' ', JSON.stringify(p));

  // 2. Sample orders by status — see what values "status" actually takes
  console.log('\n═══ order status distribution (scan first 1000) ═══');
  const sample = await db.collection('orders').limit(1000).get();
  const statusCount = {};
  const typeCount = {};
  let withDigital = 0, withArtwork = 0;
  for (const d of sample.docs) {
    const o = d.data();
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    typeCount[o.type] = (typeCount[o.type] || 0) + 1;
    if (o.digital) withDigital++;
    if (o.artworkUrl) withArtwork++;
  }
  console.log('status:', statusCount);
  console.log('type:  ', typeCount);
  console.log(`orders with digital != null: ${withDigital} of ${sample.size}`);
  console.log(`orders with artworkUrl set : ${withArtwork} of ${sample.size}`);

  // 3. One fully-populated digital order if we can find it
  console.log('\n═══ first order with digital configured ═══');
  const digQuery = await db.collection('orders').where('type', '==', 'digital').limit(1).get();
  if (!digQuery.empty) {
    console.log(JSON.stringify(digQuery.docs[0].data(), null, 2));
  } else {
    const any = await db.collection('orders').limit(1).get();
    console.log('(no type="digital" found — first order of any type)');
    console.log(JSON.stringify(any.docs[0].data(), null, 2));
  }

  // 4. Packages — ad product rate card
  console.log('\n═══ packages ═══');
  const pkgs = await db.collection('packages').get();
  for (const d of pkgs.docs) console.log(' ', JSON.stringify(d.data()));
}

main().catch(e => { console.error(e); process.exit(1); });
