const fetch = require('node-fetch');
const readline = require('readline');
const { email, password } = require('./login.json');
let authToken = null;

const callRpc = async (api, method, params, id = method) => {
    const res = await fetch(`https://unipos.me/${api}/jsonrpc`, {
      body: JSON.stringify({
        jsonrpc:"2.0",
        method:`Unipos.${method}`,
        params,
        id: `Unipos.${method}`
      }),
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
        "referrer":"https://unipos.me/all",
        ...authToken ? { "X-Unipos-Token": authToken } : {}
      },
      method: "POST"
    })
    if (res.ok) {
      const { result } = await res.json()
      return result
    } else {
      throw `Failed with ${res.status}`
    }
}

const getToken = async () => {
  if (!authToken) {
    const { authn_token } = await callRpc('a', 'Login', {email_address: email, password});
    authToken = authn_token;
    return authToken;
  } else {
    return Promise.resolve(authToken);
  }
};

const getList = async (after = "", count = 20) => {
  const result = await callRpc('q', 'GetCards2', { offset_card_id: after, count });
  return result;
};

const getClap = () => new Promise(resolve => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('clap for: ', (answer) => {
    rl.close();
    resolve(answer.split(' ').map(s => +s));
  });
});

const clap = async (id, point) => {
  return callRpc('c', 'Praise', { card_id: id, count: point }, `Unipos.Praise_${id}_${point}`)
}

const db=x=>{console.log(x);return x}

const getPoint = async () => {
  const { member: { pocket: { available_point: point } } } = await callRpc('q', 'GetProfile', []);
  return point
}

const main = async() => {
  await getToken();
  let [list, point] = await Promise.all([getList("", 60), getPoint()]);
  let idx = 0;
  for (const item of list) {
    console.log('=============================');
    console.log(`id = ${idx + 1}`);
    console.log(`${item.from_member.display_name} => ${item.to_member.display_name}`);
    console.log(item.message);
    idx++;
  };
  console.log('=============================');
  console.log('=============================');
  while (true) {
    console.log(`You have ${point} point to send`);
    [id, point] = await getClap();
    const cid = list[id - 1].id;
    await clap(cid, point);
    point = await getPoint();
  }
};

main();
