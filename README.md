# melis-recovery

The Melis Recovery Tool enables Melis users to recover their funds in the event that the Melis server becomes unavailable.

To use it you need the mnemonics of all users partecipating in the account you want to recovery and a recovery file.

If you have not downloaded the latest recovery file by hand you can check if it's still in the application cache: if open, the Melis client downloads it every time it detects a new transaction.
You can download the account recovery files by going to the url #info/noserver

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with NPM)
* [Bower](https://bower.io/)
* [Ember CLI](https://ember-cli.com/)

## Installation

* `git clone <repository-url>` this repository
* `cd melis-recovery`
* `npm install`
* `bower install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4100](http://localhost:4100).

### Hosted version

You can use an hosted deployed release at this [address](https://recovery.melis.io/)

## Further Reading / Useful Links

* [melis.io](http://melis.io/)
