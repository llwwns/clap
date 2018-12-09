const fetch = require('node-fetch');
const readline = require('readline');
const { email, password } = require('./login.json');
let authToken = null;
const getToken = async () => {
  if (!authToken) {
    const res = await fetch("https://unipos.me/a/jsonrpc", {
      body: `{"jsonrpc":"2.0","method":"Unipos.Login","params":{"email_address": "${email}","password":"${password}"},"id":"Unipos.Login"}`,
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json"
      },
      method: "POST"
    })
    const { result: { authn_token } } = await res.json()
    authToken = authn_token;
    return authToken;
  } else {
    return Promise.resolve(authToken);
  }
};

const getList = async (after = "", count = 20) => {
  res = await fetch("https://unipos.me/q/jsonrpc", {
    body: `{"jsonrpc":"2.0","method":"Unipos.GetCards2","params":{"offset_card_id":"${after}","count":${count}},"id":"Unipos.GetCards2"}`,
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      "X-Unipos-Token": authToken
    },
    method: "POST"
  });
  const { result } = await res.json();
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
  fetch("https://unipos.me/c/jsonrpc", {
    body: `{"jsonrpc":"2.0","method":"Unipos.Praise","params":{"card_id":"${id}","count":${point}},"id":"Unipos.Praise_${id}_${point}"}`,
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      "X-Unipos-Token": authToken
    },
    method: "POST"
  })
}

const main = async() => {
  await getToken();
  list = await getList("", 60);
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
    [id, point] = await getClap();
    const cid = list[id - 1].id;
    console.log([cid, point]);
    await clap(cid, point);
  }
};

main();
