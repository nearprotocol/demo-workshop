<br />
<br />

<p>
<img src="https://nearprotocol.com/wp-content/themes/near-19/assets/img/logo.svg?t=1553011311" width="240">
</p>

<br />
<br />

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/kcole16/ethdenver-workshop)

## Messaging app on NEAR with AssemblyScript and Rust
### Requirements
##### IMPORTANT: Make sure you have the latest version of NEAR Shell and Node Version > 10.x 
1. node and npm
2. near shell
```
npm i -g near-shell
```
3.(optional) install yarn to build
```
npm i -g yarn
```

To develop Rust contracts you would need to:
* Install [Rustup](https://rustup.rs/):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
* Add wasm target to your toolchain:
```bash
rustup target add wasm32-unknown-unknown
```

#### Project Structure
```
contracts/
    assembly/
        main.ts <-- Main AssemblyScript contract code
        model.ts <-- Define the types for main.ts 
        tsconfig.json
    rust/
        lib.rs <--- Main Rust contract code
neardev/
out/
src/
    wallet/
    config.js <-- Config file
    index.html <-- Basic layout for your front end
    main.js <-- wire the logic and js for your app here
    test.js <-- for you to write tests
gulpfile.js
package-lock.json
package.json
README.md
```

#### Writing the AssemblyScript contracts
Define the message type in `assembly/model.ts`
```
export class PostedMessage {
    sender: string;
    text: string;
    premium: boolean;
  }
```

Import the type into `main.ts` along with a persistent data structure and `context`, which provides access to information like `sender`.
```
import { context, PersistentVector } from "near-runtime-ts";

import { PostedMessage } from "./model";
```

Define `messages` and create a new `PersistentVector`, similar to an array, made up of `PostedMessage` objects.

```
let messages = new PersistentVector<PostedMessage>("m");
```

Next, let's create a change method `addMessage` to add a new message to `messages` and store the new state.

```
export function addMessage(text: string): void {
  // Creating a new message and populating fields with our data
  let message: PostedMessage = {
    sender: context.sender,
    text: text,
    premium: context.attachedDeposit >= u128.from('100000000000000000000000')
  };
  // Adding the message to end of the the persistent collection
  messages.push(message);
}
```

Finally, create a view method `getMessages`, which retrieves and returns the latest state of `messages`

```
export function getMessages(): Array<PostedMessage> {
  let numMessages = min(MESSAGE_LIMIT, messages.length);
  let startIndex = messages.length - numMessages;
  let result = Array.create<PostedMessage>(numMessages);
  for (let i = 0; i < numMessages; i++) {
    result[i] = messages[i + startIndex];
  }
  return result;
}
```

#### Deploy the AssemblyScript contracts, run the frontend
```
npm run dev
```

#### Write the Rust contracts 
Setup the contract structure in `rust/lib.rs`
```
use borsh::{BorshDeserialize, BorshSerialize};
use near_bindgen::{
    env,
    ext_contract,
    near_bindgen,
    Promise,
};
use serde_json::json;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[near_bindgen]
#[derive(Default, BorshDeserialize, BorshSerialize)]
pub struct CrossContract {}
```

Add the interface of the AssemblyScript contract
```
#[ext_contract]
pub trait ExtGuestbook {
    fn addMessage(&mut self, text: String);
    fn getMessages(&self) -> Vec<String>;
}
```

Create the contract implementation

```
#[near_bindgen]
impl CrossContract {
}
```

Inside the implementation, create a function to call the guestbook contract's `addMessage` function

```
pub fn add_message(&mut self, account_id: String, text: String) {
    ext_guestbook::addMessage(text, &account_id, 0, 1000000000000000000);
}
```

And to add a message, then return the new message state using a promise

```
pub fn add_and_return_messages(&mut self, account_id: String, text: String) -> Promise {
    // 1) call guestbook to record a message from the signer.
    // 2) call guestbook to retrieve all messages.
    // 3) return messages as the result.
    ext_guestbook::addMessage(text, &account_id, 0, 1000000000000000000).then(
        ext_guestbook::getMessages(
            &account_id,
            0,
            1000000000000000000,
        ),
    )
}
```

#### Step 2: Build and deploy Rust smart contract
Build the contract
```
npm run build:rust
```
Create a new master account
```
near login
```

Create an account for the Rust contract
```
near create_account <accountId>
```

Deploy the contract
```
near deploy --accountId <accountId> --wasmFile=./rust/res/call_guestbook.wasm --masterAccount <masterAccountName>
```

#### Step 3: Interacting with the Rust contract
```
near call <accountId> add_and_return_messages "{\"account_id\": \"dev-1581444152742\",\"text\":\"yoyoa\"}" --accountId demodenver --gas 10000000000000000000
```
