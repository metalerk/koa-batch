'use strict';

module.exports = function (grunt) {
    grunt.config.init({
        bump: {
            options: { push: false }
        },
        jshint: {
            options: { jshintrc: '.jshintrc' },
            all: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
        },
        shell: {
            mocha: {
                command: './node_modules/.bin/mocha --harmony'
            }
        },
        simplemocha: {
            options: {
                globals: ['describe'],
                timeout: 3000,
                reporter: 'spec',
                ui: 'bdd'
            },
            files: ['test/**/*.js']
        },
        watch: {
            files: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
            tasks: ['jshint', 'shell:mocha']
        }
    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-simple-mocha');

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('test', ['jshint', 'shell:mocha']);
};
