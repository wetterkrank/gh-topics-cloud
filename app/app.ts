import { Octokit } from "@octokit/rest";
import { topicsTest } from "./test_data";

interface WordFreqs { [key: string]: number };

async function getUserTopics(username: string): Promise<WordFreqs> {
  // Should we import type OctokitResponse from @octokit/types...?
  const gh = new Octokit();
  const repos = await gh.repos.listForUser({ username: username });
  const repoNames: string[] = repos.data.map(result => result.name);

  const calls = repoNames.map(repo => gh.repos.getAllTopics({ owner: username, repo: repo }).then(response => response.data.names));
  const results: string[][] = await Promise.all(calls);
  const flatTopicsList: string[] = results.reduce((all: string[], one: string[]) => all.concat(one));

  const countedTopics: WordFreqs = flatTopicsList.reduce((result, value) => {
    result[value] ? result[value]++ : result[value] = 1;
    return result;
  }, {} as WordFreqs);
  return countedTopics;
}

function makeTopicsList(countedTopics: WordFreqs) {
  const maxFreq: number = Math.max(...Object.values(countedTopics));
  const ul = document.createElement('ul');
  for (const [topic, count] of Object.entries(countedTopics)) {
    const li = document.createElement('li');
    li.innerHTML = `${topic} (${count})`;
    ul.appendChild(li);
  }
  return ul;
}

async function submitUsername(event: Event): Promise<void> {
  event.preventDefault();
  const input = document.getElementById('username') as HTMLInputElement;
  const username: string = input.value;

  const topics: WordFreqs = await getUserTopics(username);
  // const topics: WordFreqs = topicsTest;
  const topicsList = makeTopicsList(topics);

  const output = document.getElementById('gh-topics') as HTMLDivElement;
  output.appendChild(topicsList);
}

function init():void {
  document.getElementById('search-form')!.addEventListener('submit', submitUsername);
}

document.addEventListener('DOMContentLoaded', init);
