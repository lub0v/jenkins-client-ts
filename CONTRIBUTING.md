<!-- omit in toc -->
# Contributing to Jenkins Typescript Client

First off, thanks for taking the time to contribute! ❤️

All types of contributions are encouraged and valued.
See the [Table of Contents](#table-of-contents) for different ways to help and details about how this project handles them. 
Please make sure to read the relevant section before making your contribution. 
The community looks forward to your contributions. 🎉

> And if you like the project, but don't have time to contribute, that's fine. There are other easy ways to support the project and show your appreciation, which we would also be very happy about:
> - Star the project
> - Tweet about it
> - Refer this project in your project's readme
> - Mention the project at local meetups and tell your friends/colleagues

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
    - [Reporting Bugs](#reporting-bugs)
    - [Suggesting Enhancements](#suggesting-enhancements)
    - [Your First Code Contribution](#your-first-code-contribution)
        - [Testing](#testing)
    - [Improving The Documentation](#improving-the-documentation)
    - [Styleguides](#styleguides)
        - [Commit Messages](#commit-messages)

### Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [liubov.pitko@parsable.com](mailto:liubov.pitko@parsable.com).

## I Have a Question

> If you want to ask a question, we assume that you have read the available [Documentation](https://github.com/parsable/jenkins-client-ts/blob/main/docs/readme.md).

Before you ask a question, it is best to search for existing [Issues](https://github.com/parsable/jenkins-client-ts/issues) that might help you. 
In case you have found a suitable issue and still need clarification, you can write your question in this issue. 

If you then still feel the need to ask a question and need clarification, we recommend the following:

- Open an [Issue](https://github.com/parsable/jenkins-client-ts/issues/new) with the type "Question"
- Provide as much context as you can about what you're running into.
- Provide project and platform versions (nodejs, npm, etc), depending on what seems relevant.

Once it's filed:

- The project team will answer the question as soon as possible.

## I Want To Contribute

> ### Legal Notice
> When contributing to this project, you must agree that you have authored 100% of the content, that you have the necessary rights to the content and that the content you contribute may be provided under the project license.

### Reporting Bugs

#### Before Submitting a Bug Report

A good bug report shouldn't leave others needing to chase you up for more information. Therefore, we ask you to investigate carefully, collect information and describe the issue in detail in your report. Please complete the following steps in advance to help us fix any potential bug as fast as possible.

- Make sure that you are using the latest library version.
- Determine if your bug is really a bug and not an error on your side e.g. using incompatible environment components/versions (Make sure that you have read the [documentation](https://github.com/parsable/jenkins-client-ts/blob/main/docs/readme.md). If you are looking for support, you might want to check [this section](#i-have-a-question)).
- To see if other users have experienced (and potentially already solved) the same issue you are having, check if there is not already a bug report existing for your bug or error in the [bug tracker](https://github.com/parsable/jenkins-client-ts/issues?q=label%3Abug).
- Also make sure to search the internet (including Stack Overflow) to see if users outside of the GitHub community have discussed the issue.
- Collect information about the bug:
    - Stack trace (Traceback)
    - OS, Platform and Version (Windows, Linux, macOS, x86, ARM)
    - Version of the interpreter, compiler, SDK, runtime environment, package manager, depending on what seems relevant.
    - Possibly your input and the output
    - Can you reliably reproduce the issue? And can you also reproduce it with older versions?

#### How Do I Submit a Good Bug Report?

> You must never report security related issues, vulnerabilities or bugs including sensitive information to the issue tracker, or elsewhere in public. Instead sensitive bugs must be sent by email to liubov.pitko@parsable.com

We use GitHub issues to track bugs and errors. If you run into an issue with the project:

- Open an [Issue](https://github.com/parsable/jenkins-client-ts/issues/new) with the type "Bug report" and fill all the required fields
- Explain the behavior you would expect and the actual behavior.
- Please provide as much context as possible and describe the *reproduction steps* that someone else can follow to recreate the issue on their own. This usually includes your code. For good bug reports you should isolate the problem and create a reduced test case.
- Provide the information you collected in the previous section.

Once it's filed:

- The project team will label the issue accordingly.
- A team member will try to reproduce the issue with your provided steps. If there are no reproduction steps or no obvious way to reproduce the issue, the team will ask you for those steps and mark the issue as `needs-repro`. Bugs with the `needs-repro` tag will not be addressed until they are reproduced.
- If the team is able to reproduce the issue, it will be marked `needs-fix`, as well as possibly other tags (such as `critical`), and the issue will be fixed or left to be [implemented by someone](#your-first-code-contribution).


### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion for Jenkins Typescript Client, including completely new features and minor improvements to existing functionality. Following these guidelines will help maintainers and the community to understand your suggestion and find related suggestions.

#### Before Submitting an Enhancement

- Make sure that you are using the latest version.
- Read the [documentation](https://github.com/parsable/jenkins-client-ts/blob/main/docs/readme.md) carefully and find out if the functionality is already covered, maybe by an individual configuration.
- Perform a [search](https://github.com/parsable/jenkins-client-ts/issues) to see if the enhancement has already been suggested. If it has, add a comment to the existing issue instead of opening a new one.
- Find out whether your idea fits with the scope and aims of the project. It's up to you to make a strong case to convince the project's developers of the merits of this feature. Keep in mind that we want features that will be useful to the majority of our users and not just a small subset. If you're just targeting a minority of users, consider writing an add-on/plugin library.

#### How Do I Submit a Good Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://github.com/parsable/jenkins-client-ts/issues).

- Open an [Issue](https://github.com/parsable/jenkins-client-ts/issues/new) with the type "Feature request" and fill all the required fields
- Use a **clear and descriptive title** for the issue to identify the suggestion.
- Provide a **step-by-step description of the suggested enhancement** in as many details as possible.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why. At this point you can also tell which alternatives do not work for you.
- **Explain why this enhancement would be useful** to most Jenkins Typescript Client users. You may also want to point out the other projects that solved it better and which could serve as inspiration.

### Your First Code Contribution

- Create a branch from the `main` branch and implement your feature or bugfix.

- Add tests relevant to the fixed bug or new feature and ensure [100% code coverage](#test-coverage).

- If needed, rebase to the current `main` branch before submitting your pull request. If it doesn't merge cleanly with `main` you may be asked to rebase your changes.

- Commits should be as small as possible, while ensuring that each commit is
  correct independently (i.e., each commit should compile and pass tests). 

- Open a pull request with a clear and concise description of what the fix is for, link issues related to the fix.

- After PR is opened, the "Run Tests" check and "codecov" check must pass.


Once PR's opened:

- The project team will review it and leave comments if necessary
- Once fix/feature is verified by the team, it may be merged to the `main` branch and be a part of the nex library release.

#### Testing

All tests are located under [`__tests__`](__tests__) directory in the root of the repository. 

There are two types of tests: 
 - unit tests, match `*.test.ts`
 - integration tests, match `*.int.ts`
 
Majority of the tests are integration tests that run against real jenkins instance to ensure that functionality of the library actually works.

The main integration tests file is [`all.int.ts`](__tests__/all.int.ts) - it combines almost all integration tests together to run them faster in the CI environment despite the best practice of separating tests by different files. 

[`before.ts`](__tests__/before.ts) - runs before all integration tests and waits for the Jenkins instance to be ready for testing.

#### Test coverage

This project follows the 100% code coverage standard. When making a change, make sure to write appropriate tests to ensure 100% code coverage. Code coverage is shown after `yarn test` is ran.

#### Running Tests

To run a test jenkins instance you need [docker](https://docs.docker.com/get-docker/).

In a separate tab, run Jenkins:

```
yarn run jenkins
```

Run tests: 

```
yarn run test
```

To run only unit tests:
```
yarn run test:unit
```

<details><summary>How to build new jenkins image and use it for tests</summary>

##

1. Cleanup environment:
   ```
   rm -fr .local 
   docker rmi jenkins-local
   docker rm -f jenkins
   ```
1. Run docker compose
   ```
   docker-compose up
   ```
1. Wait for jenkins to initialize and navigate to [http://localhost:8080](http://localhost:8080)
1. Copy password from docker-compose log and paste it to jenkins initial setup window
1. Install suggested plugins (may take up to 10 minutes)
1. Create admin user (username: `admin`, password: `admin`, other fields do not matter)
1. Click through default setup steps until you see a Jenkins dashboard
1. Go to [http://localhost:8080/configureSecurity/](http://localhost:8080/configureSecurity/), enable **Allow anonymous read access**, and save configuration
1. Stop `docker-compose` by `CTRL+C` and delete container `docker rm -f jenkins`
1. Build image 
   ```
   docker build . -t jenkins
   ```
   
To spin up initialized jenkins before tests use 
```
docker run --name jenkins -p 8080:8080 jenkins
```

</details>


### Improving The Documentation

The [`README.md`](docs/readme.md) is autogenerated by `yarn readme` script from:
- [`before.md`](docs/before.md) - documentation for  everything except method descriptions
- code comments - every jenkins method file has a documentation comment with parameters, examples and notes, e.g. [`builds.get.ts`](src/builds/builds.get.ts)

To update documentation, update the desired file and run `yarn readme` script to regenerate the main [`README.md`](docs/readme.md) 

## Styleguides

### Commit Messages

* Use the present tense - "Add feature" not "Added feature"
* Use the imperative mood - "Move cursor to..." not "Moves cursor to..."
* Limit the first line to 72 characters or less
* Reference issues and pull requests after the first line
* When only changing documentation, include `[ci skip]` in the commit title

## Attribution
This guide is based on the **contributing-gen**. [Make your own](https://github.com/bttger/contributing-gen)!
