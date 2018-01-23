var { generateMessage, generateLocationMessage, generatePrivateMessage } = require('./message');

describe('generateMessage', () => {
    it('should generate correct message object', () => {
        var from = 'Jen';
        var text = 'Some message';
        var message = generateMessage(from, text);

        expect(message.createdAt).toBeDefined();
        expect(message.from).toBe(from);
        expect(message.text).toBe(text);
    });
});

describe('generateLocationMessage', () => {
    it('should generate correct location object', () => {
        var latitude = 1;
        var longitude = 1;
        var from = 'Jen';
        var url = 'https://www.google.com/maps?q=1,1';
        var locationMessage = generateLocationMessage(from, latitude, longitude);

        expect(locationMessage.createdAt).toBeDefined();
        expect(locationMessage.url).toBe(url);
        expect(locationMessage.from).toBe(from);
    });
});

describe('generatePrivateMessage', () => {
    it('should generate correct private message object', () => {
        var from = 'Jen';
        var to = 'Manjul';
        var text = "Some message";
        var files = ['/images/hero.jpg', '/images/zero.jpg'];
        var message = generatePrivateMessage(from, to, text, files);

        expect(message.createdAt).toBeDefined();
        expect(message.from).toBe(from);
        expect(message.to).toBe(to);
        expect(message.text).toBe(text);
        expect(message.files).toBe(files);
    });
})