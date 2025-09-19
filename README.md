# dSocial

Experimental: Social apps and dApps on Gno.land

## Test from command line

To install `gnokey` and `gnodev`, in the gno repo enter:

    make install

To start gnodev, enter the following where <dsocial> is the root of the dsocial repo. (We run gnodev in the gno repo so that it has the correct Go version.)

    gnodev staging <dsocial>/realm/

To install the faucet, in another terminal enter:

    git clone https://github.com/gnolang/faucet
    cd faucet
    make build

To start the faucet using the mnemonic of the test1 key, enter:

    ./build/faucet serve -send-amount 10000000000ugnot -chain-id dev -remote http://localhost:26657 -mnemonic "source bonus chronic canvas draft south burst lottery vacant surface solve popular case indicate oppose farm nothing bullet exhibit title speed wink action roast"

To send coins to your user account, in another terminal enter the following (with your account number):

    curl --location --request POST 'http://localhost:8545' --header 'Content-Type: application/json' --data '{"To": "g1juz2yxmdsa6audkp6ep9vfv80c8p5u76e03vvh"}'

To register the user, enter the following (change jefft000 to your account username):

    gnokey maketx call -pkgpath "gno.land/r/gnoland/users/v1" -func "Register" -args "jefft000" -gas-fee "10000000ugnot" -gas-wanted "100000000" -send "1000000ugnot" -broadcast -chainid dev -remote 127.0.0.1:26657 jefft000

To post a message, enter the following (change jefft000 to your account username):

    gnokey maketx call -pkgpath "gno.land/r/berty/social" -func "PostMessage" -args "My first post" -gas-fee "1000000ugnot" -gas-wanted "100000000" -broadcast -chainid dev -remote 127.0.0.1:26657 jefft000

Note that this returns the "thread ID" of the new post like "(1 gno.land/r/berty/social.PostID)".

To view the result in a browser, go to the following URL (change jefft000 to your account username):

    http://127.0.0.1:8888/r/berty/social:jefft000

To post a reply, enter the following where THREADID and POSTID are both the thread ID from PostMessage
(change the account address and jefft000 to your account):

    gnokey maketx call -pkgpath "gno.land/r/berty/social" -func "PostReply" -args "g1juz2yxmdsa6audkp6ep9vfv80c8p5u76e03vvh" -args THREADID -args POSTID -args "my reply" -gas-fee "1000000ugnot" -gas-wanted "100000000" -broadcast -chainid dev -remote 127.0.0.1:26657 jefft000
