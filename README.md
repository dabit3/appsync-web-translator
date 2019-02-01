# AppSync React Translator

Text to audio translation using AWS AppSync, React, Amazon Polly, Amazon Translate, & AWS Lambda

![](https://i.imgur.com/EXZVsXR.jpg)

## Getting started

0. Clone the project & change into the new directory

```sh
git clone https://github.com/dabit3/appsync-web-translator.git

cd appsync-web-translator
```

1. Install dependencies

```sh
npm install
```

2. Initialize a new AWS Amplify project

```sh
amplify init
```

3. Add auth, storage, & AppSync services

```sh
amplify add auth

amplify add api

amplify add storage

amplify add function

amplify push
```

4. Update the AppSync Schema in your dashboard to the following:

```graphql
type Query {
	getTranslatedSentence(sentence: String!, code: String!): TranslatedSentence
}

type TranslatedSentence {
	sentence: String!
}
```

5. Update the `getTranslatedSentence` resolver to the following:

##### Request mapping template
```js
{
    "version" : "2017-02-28",
    "operation": "Invoke",
    "payload": $util.toJson($context.args)
}
```

##### Response mapping template
```js
$util.toJson($context.result)
```

6. Add the new Lambda function as a data source. Update the `getTranslatedSentence` resolver data source to use the Lambda function as the data source.

7. Update the Lambda function code to the following (make sure to replace the bucket name with your bucket name):

```js
const AWS = require('aws-sdk')
AWS.config.update({region: 'us-east-2'})
const uuidV4 = require('uuid/v4')
const translate = new AWS.Translate();
const polly = new AWS.Polly();
const s3 = new AWS.S3({
  params: {
    Bucket: '<YOURBUCKETNAME>',
  }
})

exports.handler = (event, context, callback) => {
  // Step 1: translate the text
  let message = ''
  const translateParams = {
    SourceLanguageCode: 'en',
    TargetLanguageCode: event.code,
    Text: event.sentence
  }
  
  translate.translateText(translateParams, function (err, data) {
    if (err) callback(err)
    message = data.TranslatedText

    const voices = {
      'es': 'Penelope',
      'pt': 'Vitoria',
      'de': 'Vicki',
      'en': 'Joanna',
      'fr': 'Celine'
    }

    const voice = voices[event.code]

    const pollyParams = {
      OutputFormat: "mp3", 
      SampleRate: "8000", 
      Text: message,
      TextType: "text", 
      VoiceId: voice
    };

    // step 2: synthesize the translation into speech  
    polly.synthesizeSpeech(pollyParams, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else  {
        let key = uuidV4()
        const params2 = {
          Key: 'public/' + key,
          ContentType: 'audio/mpeg',
          Body: data.AudioStream,
          ACL: 'public-read'
        };
        s3.putObject(params2, function(err, data) {
          if (err) {
            callback('error putting item: ', err)
          } else {
            callback(null, { sentence: key })
          }
        });
      }
    });
  });  
};


```

8. Add permissions to Lambda role for Polly, Translate as well as S3