var CommentBox = React.createClass({
  render: function() {
    return (
      <div className="commentBox">
        Hello, world! I am a CommentBox.aaaa
      </div>
    );
  }
});

React.render(
  <CommentBox />,
  document.getElementById('content')
);
