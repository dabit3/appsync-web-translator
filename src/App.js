import React, { Component } from 'react';
import './App.css';
import { css } from 'glamor'
import { API, Storage, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'
import spinner from './spinner.png';

const buttons = [
  'French',
  'German',
  'Portuguese',
  'Spanish',
  'Arabic',
  'Russian',
  'Hindi',
  'Italian'
]

const codes = {
  'French': { name: 'French', code: 'fr' },
  'German': { name: 'German', code: 'de' },
  'Portuguese': { name: 'Portuguese', code: 'pt' },
  'Spanish': { name: 'Spanish', code: 'es' },
  'Arabic': { name: 'Arabic', code: 'ar' },
  'Russian': { name: 'Russian', code: 'ru' },
  'Hindi': { name: 'Hindi', code: 'hi' },
  'Italian': { name: 'Italian', code: 'it' }
}

const GetAudioQuery = `
  query($sentence: String! $code: String!) {
    getTranslatedSentence(sentence: $sentence, code: $code) {
      sentence
    }
  }
`
class App extends Component {
  state = {
    play: false, language: 'French', audio: {}, text: '', audioReady: false, fetching: false
  };
  
  componentDidMount() {
    this.audio = new Audio();
    this.audio.addEventListener("ended", () => {
      this.setState({ play: false })
    });
  }

  setLanguage = l => {
    this.setState({
      language: l
    })
  }

  translate = async () => {
    if (this.state.text === '') return
    this.setState({ fetching: true, audioReady: false })
    const code = codes[this.state.language].code

    const data = {
      code,
      sentence: this.state.text
    }
    console.log('data: ', data)
    try {
      const audioData = await API.graphql(graphqlOperation(GetAudioQuery, data))
      const key = audioData.data.getTranslatedSentence.sentence
      const url = await Storage.get(key);
      console.log('The URL is', url);
      this.audio = new Audio(url)
      this.setState({
        audioReady: true,
        fetching: false
      })
    } catch (err) {
      console.log('error hitting graphql: ', err)
    }
  }

  onChange = e => {
    this.setState({ [e.target.name]: e.target.value })
  }

  playAudio = () => {
    this.audio.play()
  }

  render() {
    return (
      <div className="App">
        <p style={styles.heading}>React Translator</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {
            buttons.map((b, i) => <p
            onClick={() => this.setLanguage(b)}
            style={{...styles.languageButton, ...{ backgroundColor: this.state.language === b ? '#ff9393' : 'red' }}} key={i}>
              {b}
            </p>)
          }
        </div>
        <textarea
          name='text'
          placeholder="What would you like to translate?"
          style={styles.textarea}
          onChange={this.onChange}
        />
        <br />
        {
          this.state.fetching && <img src={spinner} className='spinner' />
        }
        {
          !this.state.fetching && <button {...css(styles.button)} onClick={this.translate}>Translate</button>
        }
        <br />
        {
          !this.state.fetching && this.state.audioReady && <button {...css(styles.button)} onClick={this.playAudio}>Play Audio</button>
        }
      </div>
    );
  }
}

const styles = {
  button: {
    width: 300,
    height: 45,
    margin: 5,
    backgroundColor: 'white',
    color: 'black',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    fontSize: 18,
    ':hover': {
      backgroundColor: '#ff9393'
    },
  },
  textarea: {
    height: 175,
    width: 475,
    marginLeft: 40,
    marginTop: 20,
    color: 'black',
    fontSize: 18,
    padding: 8
  },
  languageButton: {
    padding: '7px 20px', margin: '0px 3px', cursor: 'pointer'
  },
  heading: {
    fontSize: 60, margin: '20px 0px'
  }
}

export default withAuthenticator(App);
