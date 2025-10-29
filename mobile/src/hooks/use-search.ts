import { User } from "@gno/types";
import { useGnoNativeContext } from "@gnolang/gnonative";

const MAX_RESULT = 10;

export const useSearch = () => {
  const { gnonative } = useGnoNativeContext();

  async function getJsonUserByName(username: string) : Promise<User | undefined> {

    let result = "";
    try {
       result = await gnonative.qEval("gno.land/r/sys/users", `(func(data *UserData, _ bool) string { return data.Addr().String() }(ResolveName("${username}")))`);
    } catch(error) {
      console.error("Error in ResolveName", error);
      return undefined;
    }
    if (!(result.startsWith("(") && result.endsWith(" string)"))) throw new Error("Malformed ResolveName response");
    const quoted = result.substring(1, result.length - " string)".length);
    const bech32 = JSON.parse(quoted);
    // To keep consistency with the rest of the app, we'll convert the bech32 to a ui8int string.
    const json = {bech32, address: await gnonative.addressFromBech32(bech32)};

    return json as User;
  }

  async function searchUser(q: string, accountToExclude?: User) {

    /*
    const result = await gnonative.qEval("gno.land/r/berty/social", `ListJsonUsersByPrefix("${q}", ${MAX_RESULT})`);
    const usernames = await convertToJson(result);
    if (accountToExclude) {
      // Remove the active account's own username.
      const i = usernames.indexOf(accountToExclude.name, 0);
      if (i >= 0) {
        usernames.splice(i, 1);
      }
    }

    return usernames;
    */
    return [];
  }

  async function convertToJson(result: string | undefined) {
    if (result === '("" string)') return undefined;

    if (!result || !(result.startsWith("(") && result.endsWith(" string)"))) throw new Error("Malformed GetPosts response");
    const quoted = result.substring(1, result.length - " string)".length);
    const json = JSON.parse(quoted);
    const jsonPosts = JSON.parse(json);

    return jsonPosts;
  }

  return {
    searchUser,
    getJsonUserByName,
  };
};

export type UseSearchReturnType = ReturnType<typeof useSearch>;
