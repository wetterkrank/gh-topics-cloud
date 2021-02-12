import "./css/normalize.css";
import "./css/style.css";

import { Octokit } from "@octokit/rest";
// import { topicsTest } from "./test_data";

interface WordFreqs { [key: string]: number };

// Should we import type OctokitResponse from @octokit/types...?
// TODO: Handle errors, add pagination, throttling, and caching
async function getUserTopics(username: string): Promise<WordFreqs> {
  // @ts-ignore
  if (typeof topicsTest !== 'undefined') return topicsTest; // for development only
  
  const gh = new Octokit();
  const repos = await gh.repos.listForUser({ username: username });
  const repoNames: string[] = repos.data.map(repo => repo.name);

  const calls = repoNames.map(repo => gh.repos.getAllTopics({ owner: username, repo: repo }).then(response => response.data.names));
  const results: string[][] = await Promise.all(calls);
  const flatTopicsList: string[] = results.reduce((all: string[], one: string[]) => all.concat(one));

  const countedTopics: WordFreqs = flatTopicsList.reduce((freqs, value) => {
    freqs[value] ? freqs[value]++ : freqs[value] = 1;
    return freqs;
  }, {} as WordFreqs);
  return countedTopics;
}

function toScale(x: number, max: number, scale: number): number {
  let res: number = x / max * scale;
  res = Math.ceil(res);
  return res;
}

function makeTopicsCloud(countedTopics: WordFreqs): HTMLElement | null {
  if (Object.keys(countedTopics).length === 0) return null;

  const maxFreq: number = Math.max(...Object.values(countedTopics));
  const ul = document.createElement('ul');
  for (const [topic, count] of Object.entries(countedTopics)) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="https://github.com/topics/${topic}">${topic}</a>`;
    li.classList.add(`f${toScale(count, maxFreq, 5)}`);  // NOTE: for the component, we need better class name or inline style
    ul.appendChild(li);
  }
  return ul;
}

function spinner(): HTMLElement {
  const loader = document.createElement('div');
  loader.classList.add('loader');
  return loader;
}

async function demoTopics(event: Event, input: HTMLInputElement, output: HTMLElement): Promise<void> {
  event.preventDefault();
  const username: string = input.value;
  output.firstChild ? output.firstChild.replaceWith(spinner()) : output.appendChild(spinner());
  
  const topics: WordFreqs = await getUserTopics(username);
  const topicsList: HTMLElement | null = makeTopicsCloud(topics);
  if (topicsList) {
    output.firstChild ? output.firstChild.replaceWith(topicsList) : output.appendChild(topicsList);
  } else {
    output.textContent = 'No topics found for this username';
  }
}

function init():void {
  const input = document.getElementById('username') as HTMLInputElement;
  const output = document.getElementById('gh-topics') as HTMLElement;
  document.getElementById('search-form')!
    .addEventListener('submit', (event) => { demoTopics(event, input, output) });
}

document.addEventListener('DOMContentLoaded', init);
