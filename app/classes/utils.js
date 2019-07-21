import fetch from 'fetch'

class DriverUtils {

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  static async loadJsonUrl(url, params, opts) {
    console.log("Loading JSON from url: " + url)
    if (!params)
      params = {}
    // params['no-cors'] = true
    //params['mode'] = 'no-cors'
    if (opts && opts.doDebug)
      console.log("Fetching URL: " + url)
    try {
      const res = await fetch(url, params)
      if (opts && opts.doDebug)
        console.log("api result: " + JSON.stringify(res))
      if (res.status !== 200)
        if (!opts || !opts.okErrorCodes || !opts.okErrorCodes.includes(res.status)) {
          console.log("URL returned error " + res.status + ": " + JSON.stringify(res))
          return null
        }
      return res.json()
    } catch (ex) {
      console.log("Unable to read from " + url + JSON.stringify(ex))
      return null
    }
  }

}

export default DriverUtils
