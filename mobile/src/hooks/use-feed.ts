import { ParentPost, Post, User } from "@gno/types";
import { useGnoNativeContext } from "@gnolang/gnonative";
import { useUserCache } from "./use-user-cache";
import useGnoJsonParser from "./use-gno-json-parser";
import { useIndexerContext } from "@gno/provider/indexer-provider";
import { Alert } from "react-native";

interface ThreadPosts {
  data: Post[];
  n_posts: number;
}

export const useFeed = () => {
  const { gnonative } = useGnoNativeContext();
  const cache = useUserCache();
  const parser = useGnoJsonParser();
  const indexer = useIndexerContext();

  async function getThreadPosts(address: string, threadId: number, postId: number, startIndex: number, endIndex: number) : Promise<string> {
    const postInfos = await gnonative.qEval("gno.land/r/gnoland/boards2/v1", `GetPosts(1,${threadId},${postId},${startIndex},${endIndex})`);
    const totalRegex = /^\((\d+) int\)/g;
    const totalMatch = totalRegex.exec(postInfos);
    if (!totalMatch)
      throw new Error("Can't find total in GetPosts response");
    const total = Number(totalMatch![1]);

    const postRegex = /\(struct{\((\d+) gno.land\/r\/gnoland\/boards2\/v1.PostID\),\((\d+) gno.land\/r\/gnoland\/boards2\/v1.BoardID\),\("(\w+)" .uverse.address\),\("([^"]*)" string\),\("([^"]*)" string\),\((\w+) bool\),\((\w+) bool\),\((\d+) gno.land\/r\/gnoland\/boards2\/v1.PostID\),\((\d+) gno.land\/r\/gnoland\/boards2\/v1.PostID\),\((\d+) gno.land\/r\/gnoland\/boards2\/v1.BoardID\),\((\d+) int\),\((\d+) int\),\((\d+) int\),\("([^"]+)" string\)} gno.land\/r\/gnoland\/boards2\/v1.PostInfo\)/g;
    let posts = [];
    let index = 0;
    let match;
    while ((match = postRegex.exec(postInfos)) !== null) {
      const postId = Number(match[1]);
      const boardId = Number(match[2]);
      const createdAt = match[14];
      const creator = match[3];
      const n_replies = Number(match[11]);
      const n_replies_all = Number(match[12]);
      const thread_id = Number(match[8]);
      const parent_id = Number(match[9]);
      const hidden = (match[6] == "true");
      let title = match[4];
      let body = match[5];
      if (hidden) {
        if (parent_id == 0)
          // Don't show hidden threads
          continue;
        else
          title = "⚠ Reply is hidden as it has been flagged as inappropriate";
        body = title;
      }
      posts.push({index, post:{id: postId, boardId, createdAt, creator, n_gnods: 0, n_replies, n_replies_all, thread_id, parent_id, title, body}});
      ++index;
    }

    let data = {n_threads: total, posts: posts}
    return "(" + JSON.stringify(JSON.stringify(data)) + " string)";
  }

  async function fetchThreadPosts(address: string, startIndex: number, endIndex: number): Promise<ThreadPosts> {
    const result = await getThreadPosts(address, 0, 0, startIndex, endIndex);
    const json = await enrichData(result);

    return json;
  }

  async function fetchThread(address: string, threadId: number, postId: number): Promise<ThreadPosts> {
    const result = await getThreadPosts(address, threadId, postId, 0, 100);
    const json = await enrichData(result);

    return json;
  }

  async function fetchFeed(address: string, startIndex: number, endIndex: number): Promise<ThreadPosts> {
    try {
      const [nHomePosts, addrAndIDs] = await indexer.getHomePosts(address, BigInt(startIndex), BigInt(endIndex));
      const result = await gnonative.qEval("gno.land/r/berty/social", `GetJsonTopPostsByID(${addrAndIDs})`);
      return await enrichData(result, nHomePosts);
    } catch (error) {
      Alert.alert("Error while fetching posts", " " + error);
      throw error;
    }
  }

  async function enrichData(result: string, nHomePosts?: number) {
    const jsonResult = parser.toJson(result);
    // If isThread then jsonResult is {n_threads: number, posts: array<{index: number, post: Post}>} from GetPosts.
    const isThread = "n_threads" in jsonResult;
    const jsonPosts = isThread ? jsonResult.posts : jsonResult;
    const n_posts = isThread ? jsonResult.n_threads : nHomePosts;

    const posts: Post[] = [];

    for (const jsonPost of jsonPosts) {
      const post = isThread ? jsonPost.post : jsonPost;
      const creator = await cache.getUser(post.creator);

      let repost_parent: Post | undefined;

      if (post.repost_user && post.parent_id) {
        const parent_user = await cache.getUser(post.repost_user as string);
        const repost = await fetchParentPost(post.parent_id, post.repost_user as string);
        repost_parent = convertToPost(repost, parent_user);
      }

      posts.push(convertToPost(post, creator, repost_parent));
    }

    return {
      data: posts.reverse(),
      n_posts,
    };
  }

  function convertToPost(jsonPost: any, creator: User, repost_parent?: ParentPost): Post {
    const post: Post = {
      user: {
        name: creator.name,
        address: creator.address,
        avatar: creator.avatar,
        bech32: ''
      },
      id: jsonPost.id,
      title: jsonPost.title,
      post: jsonPost.body,
      date: jsonPost.createdAt,
      n_replies: jsonPost.n_replies,
      n_gnods: jsonPost.n_gnods,
      n_replies_all: jsonPost.n_replies_all,
      thread_id: jsonPost.thread_id,
      parent_id: jsonPost.parent_id,
      repost_parent,
    }

    return post;
  }

  async function fetchParentPost(postId: number, address: string) {
    const payload = `[]UserAndPostID{{\"${address}\", ${postId}},}`
    const result = await gnonative.qEval("gno.land/r/berty/social", `GetJsonTopPostsByID(${payload})`);
    const jsonResult = parser.toJson(result);
    return jsonResult[0];
  }

  async function fetchCount(address: string) {
    // Set startIndex and endIndex to 0 to just get the n_posts.
    const r = await fetchThreadPosts(address, 0, 0);
    return r.n_posts;
  }

  return { fetchFeed, fetchCount, fetchThread, fetchThreadPosts };
};
