import "isomorphic-fetch"

import chai from "chai"
import sinonChai from "sinon-chai"
import chaiAsPromised from "chai-as-promised"
import chaiImmutable from "chai-immutable"

chai.use(sinonChai)
chai.use(chaiAsPromised)
chai.use(chaiImmutable)

global.expect = chai.expect
